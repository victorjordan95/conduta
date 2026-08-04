param(
  [Parameter(Mandatory = $true)]
  [string]$BackupDirectory,

  [switch]$AllowDowntime
)

$ErrorActionPreference = 'Stop'
$repoRoot = (Resolve-Path (Join-Path $PSScriptRoot '..\..')).Path
$target = (Resolve-Path -LiteralPath $BackupDirectory).Path
$composeFile = Join-Path $repoRoot 'docker-compose.yml'

if ($target -eq $repoRoot) {
  throw 'O diretório de backup não pode ser a raiz do repositório.'
}

Push-Location (Join-Path $repoRoot 'backend')
try {
  node scripts/neo4j-audit.js
  if ($LASTEXITCODE -ne 0) { throw 'A auditoria Neo4j falhou; backup cancelado.' }

  $containerId = (docker compose -f $composeFile ps -q neo4j).Trim()
  if (-not $containerId) { throw 'Container Neo4j não encontrado.' }

  $wasRunning = (docker inspect -f '{{.State.Running}}' $containerId).Trim() -eq 'true'
  if ($wasRunning -and -not $AllowDowntime) {
    throw 'O Neo4j Community exige dump offline. Nenhum backup foi criado: execute novamente com -AllowDowntime em uma janela de manutenção.'
  }

  $restartRequired = $false
  if ($wasRunning) {
    docker compose -f $composeFile stop neo4j
    if ($LASTEXITCODE -ne 0) { throw 'Não foi possível interromper o Neo4j para o backup offline.' }
    $restartRequired = $true
  }

  try {
    $timestamp = Get-Date -Format 'yyyyMMdd-HHmmss'
    $dumpName = "neo4j-$timestamp.dump"
    $dumpPath = Join-Path $target $dumpName

    # O container temporário monta o mesmo volume de dados, com o serviço offline.
    docker compose -f $composeFile run --rm --no-deps --entrypoint neo4j-admin --volume "${target}:/backups" neo4j database dump neo4j --to-path=/backups --overwrite-destination=true
    if ($LASTEXITCODE -ne 0) { throw 'neo4j-admin não conseguiu criar o dump offline.' }

    Move-Item -LiteralPath (Join-Path $target 'neo4j.dump') -Destination $dumpPath -Force
    Get-FileHash -Algorithm SHA256 -LiteralPath $dumpPath |
      Select-Object Algorithm, Hash, Path |
      ConvertTo-Json | Set-Content -LiteralPath "$dumpPath.sha256.json" -Encoding utf8

    Write-Output "Backup criado: $dumpPath"
  } finally {
    if ($restartRequired) {
      docker compose -f $composeFile start neo4j
      if ($LASTEXITCODE -ne 0) { throw 'O backup terminou, mas o Neo4j não reiniciou automaticamente. Verifique o serviço imediatamente.' }
    }
  }
} finally {
  Pop-Location
}

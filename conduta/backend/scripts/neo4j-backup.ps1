param(
  [Parameter(Mandatory = $true)]
  [string]$BackupDirectory
)

$ErrorActionPreference = 'Stop'
$repoRoot = (Resolve-Path (Join-Path $PSScriptRoot '..\..')).Path
$target = (Resolve-Path -LiteralPath $BackupDirectory).Path

if ($target -eq $repoRoot) {
  throw 'O diretório de backup não pode ser a raiz do repositório.'
}

Push-Location (Join-Path $repoRoot 'backend')
try {
  node scripts/neo4j-audit.js
  if ($LASTEXITCODE -ne 0) { throw 'A auditoria Neo4j falhou; backup cancelado.' }

  $containerId = (docker compose -f (Join-Path $repoRoot 'docker-compose.yml') ps -q neo4j).Trim()
  if (-not $containerId) { throw 'Container Neo4j não encontrado.' }

  $timestamp = Get-Date -Format 'yyyyMMdd-HHmmss'
  $containerPath = "/tmp/neo4j-backup-$timestamp"
  $dumpName = "neo4j-$timestamp.dump"
  $dumpPath = Join-Path $target $dumpName

  docker exec $containerId neo4j-admin database dump neo4j --to-path=$containerPath --overwrite-destination=true
  if ($LASTEXITCODE -ne 0) { throw 'neo4j-admin não conseguiu criar o dump.' }

  docker cp "${containerId}:$containerPath/neo4j.dump" $dumpPath
  if ($LASTEXITCODE -ne 0) { throw 'Não foi possível copiar o dump para o diretório aprovado.' }

  Get-FileHash -Algorithm SHA256 -LiteralPath $dumpPath |
    Select-Object Algorithm, Hash, Path |
    ConvertTo-Json | Set-Content -LiteralPath "$dumpPath.sha256.json" -Encoding utf8

  Write-Output "Backup criado: $dumpPath"
} finally {
  Pop-Location
}

#!/usr/bin/env bash
# deploy.sh — Script de deploy/atualização para produção
# Uso: ./deploy.sh [--first-run]
set -e

ROOT="$(cd "$(dirname "$0")" && pwd)"
COMPOSE="docker compose -f $ROOT/docker-compose.production.yml --env-file $ROOT/.env.production"

echo ""
echo "════════════════════════════════════════════"
echo "  🚀 Conduta — Deploy de Produção"
echo "════════════════════════════════════════════"
echo ""

# Verifica se o .env.production existe
if [ ! -f "$ROOT/.env.production" ]; then
  echo "❌ Arquivo .env.production não encontrado!"
  echo "   Copie .env.production.example e preencha os valores."
  exit 1
fi

# Primeiro deploy: sobe tudo, roda migrations e seeds
if [ "$1" = "--first-run" ]; then
  echo "▶ Primeiro deploy: subindo infraestrutura..."
  $COMPOSE up -d postgres neo4j

  echo "⏳ Aguardando PostgreSQL..."
  until $COMPOSE exec -T postgres pg_isready -U conduta -q 2>/dev/null; do sleep 2; done

  echo "⏳ Aguardando Neo4j..."
  until $COMPOSE exec -T neo4j wget -qO- http://localhost:7474 > /dev/null 2>&1; do sleep 3; done

  echo "▶ Rodando migrations PostgreSQL..."
  $COMPOSE run --rm backend node src/db/migrate.js

  echo "▶ Rodando migration Neo4j..."
  $COMPOSE run --rm backend node src/db/migrate-neo4j-status.js

  echo "▶ Rodando seed Neo4j..."
  $COMPOSE run --rm backend node src/db/seed-neo4j.js

  echo "▶ Subindo todos os serviços..."
  $COMPOSE up -d --build

else
  # Updates: build novo e restart sem downtime
  echo "▶ Fazendo pull do código mais recente..."
  git -C "$ROOT" pull origin main

  echo "▶ Rebuild das imagens e restart..."
  $COMPOSE up -d --build --remove-orphans

  echo "▶ Removendo imagens antigas..."
  docker image prune -f
fi

echo ""
echo "✅ Deploy concluído!"
echo ""
$COMPOSE ps

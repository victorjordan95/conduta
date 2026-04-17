#!/usr/bin/env bash
# dev.sh — Sobe o ambiente Conduta completo
set -e

ROOT="$(cd "$(dirname "$0")" && pwd)"

echo "▶ Subindo containers (PostgreSQL + Neo4j)..."
docker-compose -f "$ROOT/docker-compose.yml" up -d

echo "⏳ Aguardando PostgreSQL ficar pronto..."
until docker-compose -f "$ROOT/docker-compose.yml" exec -T postgres pg_isready -U conduta -q 2>/dev/null; do
  sleep 1
done

echo "⏳ Aguardando Neo4j ficar pronto..."
until curl -s http://localhost:7474 > /dev/null 2>&1; do
  sleep 2
done

echo "▶ Rodando migrations PostgreSQL..."
(cd "$ROOT/backend" && node src/db/migrate.js)

echo "▶ Rodando migration de status Neo4j..."
(cd "$ROOT/backend" && node src/db/migrate-neo4j-status.js)

echo "▶ Rodando seed Neo4j..."
(cd "$ROOT/backend" && node src/db/seed-neo4j.js)

echo "▶ Iniciando backend (porta 3000)..."
(cd "$ROOT/backend" && npm run dev) &

echo "▶ Iniciando frontend (porta 5173)..."
(cd "$ROOT/frontend" && npm run dev) &

echo ""
echo "════════════════════════════════════════"
echo "  Conduta rodando!"
echo "  Frontend : http://localhost:5173"
echo "  Backend  : http://localhost:3000"
echo "  Admin    : http://localhost:5173/admin/knowledge"
echo "════════════════════════════════════════"
echo ""
echo "  Ctrl+C para encerrar tudo."

wait

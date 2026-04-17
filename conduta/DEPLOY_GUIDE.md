# 🚀 Guia de Deploy — Conduta

> Stack: React + Vite · Node.js/Express · PostgreSQL · Neo4j · OpenRouter  
> Estratégia recomendada: **VPS com Docker Compose**

---

## Por que VPS com Docker?

O projeto usa **duas bases de dados** (PostgreSQL + Neo4j). Plataformas como Vercel ou Railway cobrariam caro para hospedar Neo4j, enquanto um VPS simples suporta tudo com Docker Compose — exatamente como você já roda localmente.

| Opção | Custo/mês | Prós | Contras |
|---|---|---|---|
| **Hetzner VPS (recomendado)** | ~€4–6 | Barato, rápido, Docker nativo | Requer configuração manual |
| Railway | ~$15–25 | Fácil, CI/CD automático | Neo4j caro como serviço |
| DigitalOcean Droplet | ~$12 | Confiável, boa doc | Mais caro que Hetzner |
| Render | $0–7 | Grátis no início | Dorme após inatividade, Neo4j manual |

**Recomendação: Hetzner CX22** — 2 vCPU, 4 GB RAM, 40 GB SSD, ~€3,79/mês. Ideal para esse projeto.

---

## Arquivos criados neste guia

```
conduta/
├── backend/
│   └── Dockerfile                    ← imagem de produção do backend
├── frontend/
│   ├── Dockerfile                    ← imagem de produção do frontend
│   └── nginx.conf                    ← SPA fallback para React Router
├── nginx/
│   └── default.conf                  ← proxy reverso + SSL
├── docker-compose.production.yml     ← orquestração de produção
├── .env.production.example           ← template de variáveis de ambiente
├── deploy.sh                         ← script de deploy automático
└── DEPLOY_GUIDE.md                   ← este arquivo
```

---

## PARTE 1 — Preparação local (faça agora)

### 1.1 — Adicione ao `.gitignore`

Abra o `.gitignore` na raiz e certifique-se de que estas linhas existem:

```
.env.production
backend/.env
node_modules/
```

### 1.2 — Suba o código para o GitHub

```bash
# Dentro da pasta do projeto
git init                          # se ainda não tiver git
git add .
git commit -m "feat: adiciona configuração de deploy"
git remote add origin https://github.com/SEU_USUARIO/conduta.git
git push -u origin main
```

---

## PARTE 2 — Criar e configurar o servidor

### 2.1 — Criar VPS na Hetzner

1. Acesse [hetzner.com/cloud](https://www.hetzner.com/cloud)
2. Crie uma conta (verificação simples)
3. Clique em **New Project → Add Server**
4. Escolha:
   - **Localização**: Nuremberg ou Helsinki (mais próximos do Brasil com bom ping)
   - **Image**: Ubuntu 24.04
   - **Type**: **CX22** (2 vCPU, 4 GB RAM) — €3,79/mês
   - **SSH Key**: adicione sua chave pública (veja abaixo)

**Como adicionar sua chave SSH:**
```bash
# No seu computador local (se não tiver chave, gere uma):
ssh-keygen -t ed25519 -C "deploy@conduta"

# Copie a chave pública:
cat ~/.ssh/id_ed25519.pub
# Cole esse valor no campo "SSH Key" na Hetzner
```

5. Clique em **Create & Buy**. Em ~30 segundos você terá o IP do servidor.

### 2.2 — Apontar domínio para o servidor (opcional mas recomendado)

Se você tiver um domínio (ex: Namecheap, Registro.br, GoDaddy):

1. Vá ao painel DNS do seu domínio
2. Adicione um registro **A**:
   - Nome: `@` (ou `conduta`)
   - Valor: `IP_DO_SEU_SERVIDOR`
   - TTL: 300
3. Aguarde 5–30 minutos para propagar

> Se não tiver domínio, pode usar o IP diretamente (sem SSL) em um primeiro momento.

---

## PARTE 3 — Configurar o servidor

### 3.1 — Conecte via SSH

```bash
ssh root@IP_DO_SEU_SERVIDOR
```

### 3.2 — Atualize o sistema e instale o Docker

```bash
# Atualiza pacotes
apt update && apt upgrade -y

# Instala Docker (método oficial)
curl -fsSL https://get.docker.com | sh

# Verifica instalação
docker --version
docker compose version
```

### 3.3 — Crie um usuário não-root (boa prática)

```bash
adduser deploy
usermod -aG sudo deploy
usermod -aG docker deploy

# Copie a chave SSH para o novo usuário
rsync --archive --chown=deploy:deploy ~/.ssh /home/deploy

# Teste o acesso (em outro terminal):
# ssh deploy@IP_DO_SEU_SERVIDOR
```

### 3.4 — Configure o firewall

```bash
ufw allow OpenSSH
ufw allow 80/tcp
ufw allow 443/tcp
ufw enable
ufw status
```

---

## PARTE 4 — Deploy da aplicação

### 4.1 — Clone o repositório no servidor

```bash
# No servidor, logado como deploy
ssh deploy@IP_DO_SEU_SERVIDOR

cd /home/deploy
git clone https://github.com/SEU_USUARIO/conduta.git
cd conduta
```

### 4.2 — Crie o arquivo de variáveis de produção

```bash
cp .env.production.example .env.production
nano .env.production
```

Preencha **todos os valores**:

```env
POSTGRES_DB=conduta
POSTGRES_USER=conduta
POSTGRES_PASSWORD=SenhaForteAqui123!

NEO4J_USER=neo4j
NEO4J_PASSWORD=SenhaForteNeo4j456!

JWT_SECRET=uma_string_aleatoria_longa_e_segura_aqui
JWT_EXPIRES_IN=8h
ADMIN_SECRET=chave_admin_secreta_aqui

OPENROUTER_API_KEY=sk-or-v1-SEU_TOKEN_AQUI
OPENROUTER_MODEL=anthropic/claude-sonnet-4-5

VITE_API_URL=https://SEU_DOMINIO.com
```

> **Gerar senhas fortes:** `openssl rand -base64 32`

### 4.3 — Configure o Nginx para seu domínio

```bash
nano nginx/default.conf
```

Substitua **todas** as ocorrências de `SEU_DOMINIO.com` pelo seu domínio real. Salve com `Ctrl+X → Y → Enter`.

### 4.4 — Primeiro deploy

```bash
chmod +x deploy.sh
./deploy.sh --first-run
```

Este comando vai:
1. Subir PostgreSQL e Neo4j
2. Rodar as migrations
3. Rodar os seeds
4. Fazer o build e subir todos os containers

### 4.5 — Obter certificado SSL (HTTPS gratuito)

```bash
# Certifique-se de que o domínio já aponta para o servidor
# Solicite o certificado:
docker compose -f docker-compose.production.yml run --rm certbot \
  certonly --webroot \
  --webroot-path=/var/www/certbot \
  --email SEU_EMAIL@gmail.com \
  --agree-tos \
  --no-eff-email \
  -d SEU_DOMINIO.com \
  -d www.SEU_DOMINIO.com

# Reinicie o nginx para carregar o certificado:
docker compose -f docker-compose.production.yml restart nginx
```

✅ Seu site agora está em `https://SEU_DOMINIO.com`

---

## PARTE 5 — Atualizações futuras

Sempre que fizer alterações no código:

```bash
# Na sua máquina local:
git add .
git commit -m "feat: sua alteração"
git push origin main

# No servidor:
ssh deploy@IP_DO_SERVIDOR
cd /home/deploy/conduta
./deploy.sh
```

O script vai fazer `git pull`, rebuild das imagens e restart automático.

---

## PARTE 6 — Monitoramento e manutenção

### Ver logs em tempo real
```bash
# Todos os serviços:
docker compose -f docker-compose.production.yml logs -f

# Apenas o backend:
docker compose -f docker-compose.production.yml logs -f backend
```

### Ver status dos containers
```bash
docker compose -f docker-compose.production.yml ps
```

### Backup do banco PostgreSQL
```bash
docker compose -f docker-compose.production.yml exec postgres \
  pg_dump -U conduta conduta > backup_$(date +%Y%m%d).sql
```

### Reiniciar um serviço
```bash
docker compose -f docker-compose.production.yml restart backend
```

---

## Resumo de custos

| Item | Custo |
|---|---|
| Hetzner CX22 VPS | ~€3,79/mês (~R$22) |
| Domínio (opcional, ex: .com.br) | ~R$40/ano |
| SSL (Let's Encrypt) | **Grátis** |
| OpenRouter (IA) | Pay-per-use |
| **Total fixo/mês** | **~R$22–30** |

---

## Problemas comuns

**Container não sobe / erro de porta:**
```bash
docker compose -f docker-compose.production.yml logs NOME_DO_SERVICO
```

**Migrations falharam:**
```bash
docker compose -f docker-compose.production.yml run --rm backend node src/db/migrate.js
```

**Neo4j demorou muito para subir:**
O Neo4j pode levar até 60s no primeiro boot. O `healthcheck` do docker-compose aguarda automaticamente.

**Certificado SSL com erro:**
Verifique se o DNS do domínio já propagou: `nslookup SEU_DOMINIO.com`

---

*Guia gerado para o projeto Conduta — stack Node.js + React + PostgreSQL + Neo4j*

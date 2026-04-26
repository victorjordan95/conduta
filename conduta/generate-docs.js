#!/usr/bin/env node
const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

const OUT = path.join(__dirname, 'conduta-backend-documentacao.pdf');
const doc = new PDFDocument({ margin: 55, size: 'A4', bufferPages: true });
doc.pipe(fs.createWriteStream(OUT));

// ── Paleta ──────────────────────────────────────────────────────────────────
const C = {
  navy:    '#1a2744',
  blue:    '#2563eb',
  teal:    '#0d9488',
  gray:    '#6b7280',
  light:   '#f1f5f9',
  white:   '#ffffff',
  text:    '#1e293b',
  border:  '#cbd5e1',
  green:   '#16a34a',
  orange:  '#d97706',
  red:     '#dc2626',
};

// ── Helpers ──────────────────────────────────────────────────────────────────
function pageWidth() { return doc.page.width - doc.page.margins.left - doc.page.margins.right; }

function hLine(y, color = C.border) {
  const yy = y ?? doc.y;
  doc.moveTo(doc.page.margins.left, yy)
     .lineTo(doc.page.width - doc.page.margins.right, yy)
     .strokeColor(color).lineWidth(0.5).stroke();
}

function chip(label, color, x, y) {
  const pad = 5;
  const w = doc.widthOfString(label) + pad * 2 + 2;
  doc.roundedRect(x, y - 2, w, 14, 3).fill(color);
  doc.fillColor(C.white).fontSize(7).font('Helvetica-Bold')
     .text(label, x + pad, y, { lineBreak: false });
  return w + 5;
}

function sectionTitle(title, icon = '') {
  doc.addPage();
  // cabeçalho colorido
  doc.rect(0, 0, doc.page.width, 52).fill(C.navy);
  doc.fillColor(C.white).fontSize(18).font('Helvetica-Bold')
     .text(`${icon}  ${title}`, doc.page.margins.left, 16, { lineBreak: false });
  doc.moveDown(3.2);
}

function h2(title) {
  doc.moveDown(0.6);
  doc.fillColor(C.blue).fontSize(13).font('Helvetica-Bold').text(title);
  hLine(doc.y + 1, C.blue);
  doc.moveDown(0.5);
}

function h3(title) {
  doc.moveDown(0.3);
  doc.fillColor(C.navy).fontSize(11).font('Helvetica-Bold').text(title);
  doc.moveDown(0.2);
}

function body(text) {
  doc.fillColor(C.text).fontSize(9.5).font('Helvetica').text(text, { lineGap: 3 });
  doc.moveDown(0.3);
}

function bullet(items) {
  items.forEach(item => {
    doc.fillColor(C.text).fontSize(9.5).font('Helvetica')
       .text(`• ${item}`, { indent: 12, lineGap: 2 });
  });
  doc.moveDown(0.3);
}

function codeBlock(code) {
  const lines = code.split('\n');
  const h = lines.length * 13 + 12;
  doc.rect(doc.page.margins.left, doc.y, pageWidth(), h).fill(C.navy);
  doc.fillColor('#a5f3fc').fontSize(8.5).font('Courier')
     .text(code, doc.page.margins.left + 10, doc.y - h + 6, {
       width: pageWidth() - 20,
       lineGap: 2,
     });
  doc.moveDown(0.6);
}

function infoBox(label, text, color = C.teal) {
  const startY = doc.y;
  doc.rect(doc.page.margins.left, startY, 3, 40).fill(color);
  doc.fillColor(color).fontSize(8).font('Helvetica-Bold')
     .text(label, doc.page.margins.left + 10, startY + 2);
  doc.fillColor(C.text).fontSize(9).font('Helvetica')
     .text(text, doc.page.margins.left + 10, doc.y, { width: pageWidth() - 15, lineGap: 2 });
  doc.moveDown(0.6);
}

function techCard(name, version, desc, tagColor) {
  const x = doc.page.margins.left;
  const y = doc.y;
  const w = pageWidth();
  doc.rect(x, y, w, 46).fill(C.light).stroke(C.border).lineWidth(0.5);
  doc.fillColor(C.navy).fontSize(10).font('Helvetica-Bold').text(name, x + 10, y + 7, { lineBreak: false });
  chip(version, tagColor, x + 10 + doc.widthOfString(name) + 8, y + 6);
  doc.fillColor(C.gray).fontSize(8.5).font('Helvetica')
     .text(desc, x + 10, y + 22, { width: w - 20, lineBreak: false });
  doc.y = y + 52;
}

function endpointRow(method, path, desc) {
  const colors = { GET: C.green, POST: C.blue, DELETE: C.red, PUT: C.orange };
  const col = colors[method] || C.gray;
  const x = doc.page.margins.left;
  const y = doc.y;
  doc.rect(x, y, pageWidth(), 22).fill(C.light);
  doc.rect(x, y, 42, 22).fill(col);
  doc.fillColor(C.white).fontSize(8).font('Helvetica-Bold')
     .text(method, x + 3, y + 7, { width: 36, align: 'center', lineBreak: false });
  doc.fillColor(C.navy).fontSize(8.5).font('Courier')
     .text(path, x + 48, y + 7, { lineBreak: false });
  doc.fillColor(C.gray).fontSize(8).font('Helvetica')
     .text(desc, x + 200, y + 8, { width: pageWidth() - 210, lineBreak: false });
  doc.y = y + 26;
}

// ════════════════════════════════════════════════════════════════════════════
// CAPA
// ════════════════════════════════════════════════════════════════════════════
doc.rect(0, 0, doc.page.width, doc.page.height).fill(C.navy);

// gradiente simulado
for (let i = 0; i < 120; i++) {
  doc.rect(0, doc.page.height - 120 + i, doc.page.width, 1)
     .fill(`#${Math.round(26 + i * 0.6).toString(16).padStart(2,'0')}` +
           `${Math.round(39 + i * 0.5).toString(16).padStart(2,'0')}` +
           `${Math.round(68 + i * 0.8).toString(16).padStart(2,'0')}`);
}

// tag categoria
doc.rect(55, 130, 120, 22).fill(C.teal).opacity(0.9);
doc.fillColor(C.white).opacity(1).fontSize(10).font('Helvetica-Bold')
   .text('DOCUMENTAÇÃO TÉCNICA', 55, 136, { width: 120, align: 'center', lineBreak: false });

// título
doc.fillColor(C.white).fontSize(46).font('Helvetica-Bold').text('CONDUTA', 55, 170);
doc.fillColor('#94a3b8').fontSize(22).font('Helvetica').text('Backend & Arquitetura', 55, 222);

hLine(270, '#334155');

// subtítulo
doc.fillColor('#cbd5e1').fontSize(12).font('Helvetica')
   .text('Assistente Clínico com IA — Documentação de sistema', 55, 285);

// badges
let bx = 55;
const badges = [
  ['Node.js', C.green], ['Express', '#4f46e5'], ['PostgreSQL', '#0ea5e9'],
  ['Neo4j', '#16a34a'], ['OpenRouter', C.orange],
];
doc.opacity(1);
badges.forEach(([label, color]) => {
  const w = doc.widthOfString(label) + 16;
  doc.roundedRect(bx, 330, w, 20, 4).fill(color).opacity(0.85);
  doc.fillColor(C.white).opacity(1).fontSize(9).font('Helvetica-Bold')
     .text(label, bx + 8, 335, { lineBreak: false });
  bx += w + 8;
});

doc.fillColor('#64748b').fontSize(9).font('Helvetica')
   .text('Versão 1.0  •  Abril 2026', 55, doc.page.height - 50);

// ════════════════════════════════════════════════════════════════════════════
// 1. VISÃO GERAL
// ════════════════════════════════════════════════════════════════════════════
sectionTitle('Visão Geral do Sistema', '○');

body(
  'O Conduta é uma aplicação web de apoio à decisão clínica desenvolvida para médicos que ' +
  'atuam em Unidades de Saúde da Família (USF) e pronto atendimento. Através de uma interface ' +
  'de chat, o médico descreve o caso em linguagem natural e recebe suporte estruturado para ' +
  'raciocínio diagnóstico e conduta terapêutica, com base em conhecimento clínico persistido ' +
  'em grafo e em casos similares históricos.'
);

h2('Problema que Resolve');
bullet([
  'Reduz o tempo de tomada de decisão em casos de média/alta complexidade na atenção primária.',
  'Organiza o raciocínio clínico com hipóteses, condutas e alertas estruturados via IA.',
  'Acumula conhecimento validado pelos próprios médicos em um grafo semântico (Neo4j).',
  'Localiza casos clínicos similares já tratados usando busca vetorial (pgvector).',
  'Permite ingestão de diretrizes e protocolos clínicos em PDF para enriquecer o contexto.',
]);

h2('Fluxo Principal');
body('Um médico autenticado inicia uma sessão e envia a descrição de um caso. O sistema:');
bullet([
  'Gera um embedding vetorial da mensagem (OpenRouter text-embedding-3-small).',
  'Busca em paralelo: contexto semântico no Neo4j (grafo clínico + chunks de PDF) e casos similares no PostgreSQL (pgvector).',
  'Monta o prompt enriquecido e envia para o LLM via OpenRouter (streaming SSE).',
  'Persiste a resposta e extrai assincronamente entidades clínicas (diagnósticos, medicamentos, relações) para revisão admin.',
  'Gera um resumo estruturado da sessão (hipótese, conduta, alertas) em background.',
]);

infoBox(
  'CONTEXTO OPERACIONAL',
  'Cada sessão representa um "caso clínico". As mensagens ficam associadas à sessão, ' +
  'permitindo que o LLM mantenha continuidade via resumo comprimido (evita explosão de contexto). ' +
  'O admin valida as entidades extraídas antes de entrarem na base de conhecimento definitiva.',
  C.teal
);

// ════════════════════════════════════════════════════════════════════════════
// 2. TECNOLOGIAS
// ════════════════════════════════════════════════════════════════════════════
sectionTitle('Stack Tecnológico', '◈');

h2('Runtime & Framework');
techCard('Node.js', 'v20+', 'Runtime JavaScript server-side. Escolhido pela maturidade do ecossistema NPM, facilidade de streaming SSE e compatibilidade com a OpenAI SDK.', C.green);
doc.moveDown(0.3);
techCard('Express.js', 'v4.18', 'Framework HTTP minimalista. Gerencia rotas, middlewares (CORS, rate limiting, autenticação) e o pipeline de requisições.', '#4f46e5');
doc.moveDown(0.3);
techCard('Helmet', 'v8', 'Conjunto de middlewares que configura headers HTTP de segurança: CSP, X-Frame-Options, HSTS, X-Content-Type-Options e outros.', C.red);

h2('Bancos de Dados');
techCard('PostgreSQL + pgvector', 'pg v8.11', 'Banco relacional principal. Armazena usuários, sessões e mensagens. A extensão pgvector adiciona coluna vector(1536) em messages para busca por similaridade coseno (HNSW index).', C.blue);
doc.moveDown(0.3);
techCard('Neo4j', 'v5 driver', 'Banco de grafos para o conhecimento clínico. Nós: Diagnostico, Medicamento, DocumentoChunk. Arestas: relações de tratamento. Suporta vector index nativo para busca semântica em chunks de PDF.', C.orange);

h2('Inteligência Artificial');
techCard('OpenRouter', 'SDK openai v4', 'Proxy de LLMs. Permite trocar de modelo (Claude, GPT-4o, Llama) sem alterar código. Usado para: análise clínica (streaming), extração de entidades, sumarização de sessão e geração de embeddings.', '#7c3aed');
doc.moveDown(0.3);
techCard('text-embedding-3-small', '1536 dims', 'Modelo de embedding da OpenAI via OpenRouter. Gera vetores de 1536 dimensões para mensagens do usuário e chunks de PDF, habilitando busca por similaridade semântica.', C.teal);

h2('Autenticação & Segurança');
techCard('JSON Web Token (JWT)', 'jsonwebtoken v9', 'Tokens assinados com HS256. Payload contém sub (userId) e role. Expiração configurável via JWT_EXPIRES_IN (padrão 8h).', C.navy);
doc.moveDown(0.3);
techCard('bcryptjs', 'v2.4', 'Hash de senhas com salt automático (rounds=10). Nunca armazena senha em texto plano.', C.gray);
doc.moveDown(0.3);
techCard('express-rate-limit', 'v8.3', 'Rate limiting por IP (login: 10 req/15min) e por userId (analyze: 10 req/min). trust proxy configurado para uso correto atrás de load balancer.', C.orange);

h2('Upload & Processamento de PDF');
techCard('Multer', 'v2.1', 'Middleware de upload multipart. Armazena o buffer em memória (sem disco). Valida mimetype e tamanho (máx 20MB). Magic bytes (%PDF) verificados antes do parse.', C.blue);
doc.moveDown(0.3);
techCard('pdf-parse', 'v2.4', 'Extrai texto de PDFs (buffer → string). O texto é dividido em chunks de ~500 chars com sobreposição, cada chunk recebe embedding e é persistido no Neo4j.', C.gray);

// ════════════════════════════════════════════════════════════════════════════
// 3. ARQUITETURA
// ════════════════════════════════════════════════════════════════════════════
sectionTitle('Arquitetura', '⬡');

h2('Estrutura de Diretórios');
codeBlock(
`conduta/backend/src/
├── app.js                  # Express app — middlewares e rotas
├── index.js                # Entry point (HTTP listen)
├── config/
│   └── system-prompt.js    # Prompt de sistema do LLM
├── db/
│   ├── pg.js               # Pool de conexão PostgreSQL
│   ├── neo4j.js            # Driver Neo4j
│   ├── migrate.js          # Runner de migrations SQL
│   └── migrations/         # Arquivos .sql de schema
├── middleware/
│   ├── auth.js             # JWT verify → req.userId, req.userRole
│   └── admin.js            # JWT + role='admin' no DB
├── routes/
│   ├── auth.js             # /auth/login, /auth/register (admin)
│   ├── sessions.js         # CRUD de sessões (ownership enforced)
│   ├── analyze.js          # POST /analyze — pipeline principal
│   ├── admin-knowledge.js  # Revisão e upload de conhecimento
│   ├── admin.js            # Gestão de nós Neo4j
│   └── feedback.js         # Feedback de mensagens
└── services/
    ├── openrouter.js       # Streaming LLM
    ├── embeddings.js       # Geração de embeddings
    ├── neo4j-search.js     # Busca semântica + keyword no grafo
    ├── case-search.js      # Busca de casos similares (pgvector)
    ├── knowledge-extractor.js  # Extração de entidades (fire-and-forget)
    ├── session-summarizer.js   # Resumo de sessão (fire-and-forget)
    └── pdf-ingestor.js     # Parse, chunk e persistência de PDFs`
);

h2('Modelo de Dados — PostgreSQL');
codeBlock(
`users
  id UUID PK | email UNIQUE | nome | senha_hash | role ('user'|'admin') | created_at

sessions
  id UUID PK | user_id FK→users | titulo | summary JSONB | created_at

messages
  id UUID PK | session_id FK→sessions | role ('user'|'assistant')
  content TEXT | embedding vector(1536) | feedback | feedback_note | created_at`
);

h2('Modelo de Dados — Neo4j (Grafo)');
body('Nós e relações do conhecimento clínico:');
codeBlock(
`(:Diagnostico { nome, cid, sinonimos[], redFlags[], excluir[], status, sourceSessionId })
(:Medicamento  { nome, classe, viaAdmin, status, sourceSessionId })
(:DocumentoChunk { texto, fonte, embedding[], status })

(:Diagnostico)-[:TRATADO_COM { dose, linha, obs }]->(:Medicamento)`
);
body('O campo status pode ser "pending" (aguarda revisão admin) ou "verified" (aprovado).');

infoBox(
  'SESSÕES CONCORRENTES',
  'O neo4j-search usa driver.session() por chamada e fecha com finally, evitando leak de sessões. ' +
  'O pool do PostgreSQL (pg.Pool) gerencia conexões automaticamente com max padrão de 10.',
  C.teal
);

// ════════════════════════════════════════════════════════════════════════════
// 4. SERVIÇOS
// ════════════════════════════════════════════════════════════════════════════
sectionTitle('Serviços & Pipeline', '⬢');

h2('Pipeline do /analyze');
body('É o coração da aplicação. Cada requisição POST /analyze segue este fluxo:');
bullet([
  '1. authMiddleware valida JWT e popula req.userId / req.userRole.',
  '2. analyzeLimiter aplica rate limit por userId (10 req/min).',
  '3. Verifica ownership da sessão: WHERE id = $1 AND user_id = $2.',
  '4. Persiste a mensagem do usuário em messages.',
  '5. Se for a primeira mensagem do caso: dispara em paralelo neo4j-search e case-search.',
  '6. Monta o prompt com histórico + contexto + resumo comprimido da sessão.',
  '7. streamAnalysis → SSE (Server-Sent Events) para o cliente enquanto o LLM gera.',
  '8. Persiste a resposta do assistente.',
  '9. Fire-and-forget: knowledge-extractor + session-summarizer (não bloqueiam a resposta).',
  '10. Fire-and-forget: gera embedding da mensagem do usuário e salva em messages.embedding.',
]);

h2('neo4j-search — Busca de Contexto Clínico');
body(
  'Combina duas estratégias para enriquecer o prompt do LLM com conhecimento da base:'
);
bullet([
  'Busca vetorial: embedding da mensagem → HNSW index em DocumentoChunk (score > 0.7). Retorna trechos de PDFs clínicos relevantes.',
  'Busca keyword: tokeniza a mensagem e procura Diagnostico/Medicamento verificados por nome ou sinônimo (CONTAINS case-insensitive).',
  'Os dois resultados são concatenados e injetados como contexto no prompt do sistema.',
]);

h2('case-search — Casos Similares (pgvector)');
body(
  'Na primeira mensagem de cada sessão, busca casos com embedding similar no histórico de outros usuários:'
);
codeBlock(
`WHERE m.role = 'user'
  AND m.embedding IS NOT NULL
  AND s.user_id != $1                                    -- exclui o próprio usuário
  AND (1 - (m.embedding <=> $2::vector)) > 0.75          -- similaridade coseno > 75%
  AND NOT EXISTS (feedback negativo na sessão)           -- filtra casos com má avaliação
LIMIT 3`
);
body('O resultado (conteúdo + resumo da sessão) é injetado como contexto adicional no LLM.');

h2('knowledge-extractor — Extração de Entidades');
body(
  'Após cada resposta do LLM, extrai assincronamente entidades clínicas via outro prompt estruturado. ' +
  'O LLM retorna JSON com diagnosticos[], medicamentos[] e relacoes[]. ' +
  'Cada entidade é persistida no Neo4j com status="pending" para revisão do admin. ' +
  'Fire-and-forget: nunca bloqueia a resposta ao usuário.'
);

h2('session-summarizer — Compressão de Contexto');
body(
  'Após a primeira resposta de cada sessão, gera um resumo estruturado em JSON ' +
  '{ hipotese, conduta, alertas[] }. Em mensagens subsequentes, esse resumo substitui ' +
  'o histórico completo no prompt, evitando crescimento ilimitado do contexto e reduzindo custos de tokens.'
);

h2('pdf-ingestor — Ingestão de Diretrizes');
bullet([
  'Recebe o buffer do PDF (upload via admin).',
  'Extrai texto com pdf-parse.',
  'Divide em chunks de ~500 caracteres com sobreposição de 100 chars.',
  'Gera embedding de cada chunk via OpenRouter.',
  'Persiste cada chunk como nó DocumentoChunk no Neo4j com vector index.',
  'Permite que o neo4j-search encontre trechos relevantes de protocolos clínicos.',
]);

// ════════════════════════════════════════════════════════════════════════════
// 5. API ENDPOINTS
// ════════════════════════════════════════════════════════════════════════════
sectionTitle('API Endpoints', '◎');

h2('Autenticação — /auth');
endpointRow('POST', '/auth/login', 'Login com email/senha → JWT com role');
doc.moveDown(0.15);
endpointRow('POST', '/auth/register', 'Cria usuário (requer token admin). Aceita role: user|admin');
doc.moveDown(0.15);
endpointRow('POST', '/auth/logout', 'Logout (stateless — invalida client-side)');

h2('Sessões — /sessions');
body('Todas as rotas requerem token JWT. Ownership enforced por user_id.');
endpointRow('GET',    '/sessions',     'Lista sessões do usuário (admin: todas as sessões com user_email/nome)');
doc.moveDown(0.15);
endpointRow('POST',   '/sessions',     'Cria nova sessão (bloqueado para admin)');
doc.moveDown(0.15);
endpointRow('GET',    '/sessions/:id', 'Retorna sessão + mensagens (admin pode ler qualquer sessão)');

h2('Análise — /analyze');
body('Rate limit: 10 req/min por userId. Admin pode chamar mas sessão deve ser própria.');
endpointRow('POST', '/analyze', 'Envia mensagem → resposta LLM via SSE (streaming)');

h2('Feedback — /feedback');
endpointRow('POST', '/feedback/:messageId', 'Registra feedback positivo/negativo em uma mensagem');

h2('Admin — /admin/knowledge');
body('Todas as rotas requerem token JWT com role=admin.');
endpointRow('GET',    '/admin/knowledge/pending',              'Lista nós Neo4j pendentes de revisão');
doc.moveDown(0.15);
endpointRow('POST',   '/admin/knowledge/:elementId/approve',   'Aprova nó → status=verified');
doc.moveDown(0.15);
endpointRow('DELETE', '/admin/knowledge/:elementId',           'Rejeita e remove nó pendente');
doc.moveDown(0.15);
endpointRow('GET',    '/admin/knowledge/documents',            'Lista PDFs ingeridos');
doc.moveDown(0.15);
endpointRow('POST',   '/admin/knowledge/documents',            'Upload de PDF clínico (multipart, máx 20MB)');

// ════════════════════════════════════════════════════════════════════════════
// 6. SEGURANÇA
// ════════════════════════════════════════════════════════════════════════════
sectionTitle('Segurança', '⬡');

h2('Autenticação & Autorização');
bullet([
  'JWT assinado com HS256. Payload: { sub: userId, role }. Secret via env JWT_SECRET.',
  'authMiddleware: verifica assinatura e popula req.userId + req.userRole.',
  'adminMiddleware: verifica assinatura + consulta role no DB (evita tokens forjados com role elevado).',
  '/auth/register protegido por adminMiddleware — apenas admin cria usuários.',
  'AdminRoute no frontend bloqueia acesso às páginas admin por role no client.',
]);

h2('Proteção de Dados');
bullet([
  'Ownership de sessão: todas as queries filtram por user_id — usuário nunca acessa dados de outro.',
  'Admin pode LER qualquer sessão (auditoria), mas não pode postar mensagens (POST /analyze filtra por user_id sem exceção).',
  'Senhas: bcrypt com 10 rounds. Mínimo 8 caracteres enforced no /register.',
  'PDFs: validação de magic bytes %PDF além do Content-Type para evitar upload de arquivos arbitrários.',
]);

h2('Headers & Transporte');
bullet([
  'helmet(): CSP, X-Frame-Options, X-Content-Type-Options, HSTS, Referrer-Policy.',
  'CORS: origins whitelist via CORS_ORIGIN env. Credentials: true.',
  'trust proxy: 1 — X-Forwarded-For correto atrás de Railway/Render/nginx.',
  'Rate limiting por IP no login (10/15min) e por userId no /analyze (10/min).',
]);

h2('Logs');
bullet([
  'Login: loga email, IP, resultado (attempt/success/failed). Stack trace apenas em NODE_ENV !== production.',
  'Erros fire-and-forget (extractor, summarizer, embed) logados sem quebrar o fluxo principal.',
  'Nenhum dado de paciente é logado diretamente.',
]);

infoBox(
  'PRÓXIMOS PASSOS DE SEGURANÇA',
  'Migrar token JWT de localStorage para httpOnly cookie (proteção contra XSS). ' +
  'Adicionar opt-in explícito de usuário para uso de sessões no case-search (LGPD Art. 7).',
  C.orange
);

// ════════════════════════════════════════════════════════════════════════════
// 7. CONFIGURAÇÃO & DEPLOY
// ════════════════════════════════════════════════════════════════════════════
sectionTitle('Configuração & Deploy', '◉');

h2('Variáveis de Ambiente');
codeBlock(
`# Banco de dados
DATABASE_URL=postgresql://user:pass@host:5432/conduta
NEO4J_URI=bolt://localhost:7687
NEO4J_USER=neo4j
NEO4J_PASSWORD=***

# JWT
JWT_SECRET=<string aleatória longa>
JWT_EXPIRES_IN=8h          # opcional, padrão 8h

# IA
OPENROUTER_API_KEY=sk-or-***

# App
PORT=3001                  # opcional, padrão 3001
CORS_ORIGIN=https://app.conduta.com.br
APP_URL=https://app.conduta.com.br
NODE_ENV=production`
);

h2('Inicialização do Banco');
codeBlock(
`# 1. Rodar migrations PostgreSQL
npm run migrate

# 2. Migrations Neo4j (status field + vector index)
npm run migrate:neo4j
npm run migrate:neo4j-vector

# 3. Seed do primeiro admin
node src/db/seeds/create-admin.js admin@clinica.com "Dr. Admin" senha-segura

# 4. (Opcional) Seed de dados clínicos Neo4j
npm run seed:neo4j`
);

h2('Scripts NPM');
bullet([
  'npm run dev — node --watch (hot reload para desenvolvimento)',
  'npm start — produção',
  'npm test — jest --runInBand (testes em série, necessário por conexão única ao DB)',
  'npm run migrate — aplica migrations SQL',
]);

h2('Testes');
body(
  'Suite com Jest + Supertest. Cobre: auth (login/register), sessions (CRUD + ownership), ' +
  'analyze (pipeline), case-search (pgvector), knowledge-extractor, neo4j-search, ' +
  'admin-knowledge (JWT real, mock de pool.query e driver Neo4j), pdf-ingestor, session-summarizer.'
);
bullet([
  'Testes de integração (auth, sessions) usam conexão real ao PostgreSQL.',
  'Testes de serviços mocam DB/Neo4j para isolamento.',
  'adminMiddleware testado com JWT gerado em runtime — sem x-admin-secret legado.',
]);

// ════════════════════════════════════════════════════════════════════════════
// Numeração de páginas
// ════════════════════════════════════════════════════════════════════════════
const pages = doc.bufferedPageRange();
for (let i = 0; i < pages.count; i++) {
  doc.switchToPage(pages.start + i);
  if (i === 0) continue; // capa sem número
  doc.fillColor(C.gray).fontSize(8).font('Helvetica')
     .text(
       `Conduta — Documentação Backend  •  Página ${i} de ${pages.count - 1}`,
       doc.page.margins.left,
       doc.page.height - 30,
       { align: 'center', width: pageWidth() }
     );
}

doc.end();
console.log('PDF gerado:', OUT);

# Conduta — Seed UPA + Knowledge Loop Design
**Data:** 2026-04-05
**Status:** Aprovado

---

## 1. Visão Geral

Duas iniciativas complementares:

1. **Expansão do seed** — ampliar `clinical-data.js` de ~48 para ~75 diagnósticos com foco em UPA (emergências cardiovasculares, neurológicas, respiratórias, metabólicas, sepse, abdome agudo, trauma, intoxicações).
2. **Loop de aprendizado** — após cada resposta gerada, um extrator LLM roda de forma assíncrona, cria nós `pending` no Neo4j, e um admin os revisa antes de promovê-los a `verified`.

---

## 2. Expansão do Seed UPA

### Diagnósticos a adicionar (~27 novos)

| Grupo | Diagnósticos |
|-------|-------------|
| Cardiovascular | Síndrome Coronariana Aguda (STEMI/NSTEMI/Angina instável), Edema Agudo de Pulmão, Crise/Emergência Hipertensiva, Taquicardia Supraventricular |
| Neurológico | AVC Isquêmico, AVC Hemorrágico, Cefaleia em Trovoada (HSA), Síncope |
| Respiratório | Crise Asmática Grave, Pneumotórax Espontâneo, TEP |
| Metabólico | Cetoacidose Diabética, Estado Hiperosmolar Hiperglicêmico, Hipoglicemia Grave |
| Sepse/Choque | Sepse/Choque Séptico, Choque Hipovolêmico, Anafilaxia |
| Abdome | Apendicite Aguda, Cólica Renal (Ureterolitíase), Pancreatite Aguda, Obstrução Intestinal |
| Outros | TCE Leve/Moderado, Status Epilepticus, Intoxicação por Paracetamol, Intoxicação por Benzodiazepínico, Intoxicação por Organofosforado |

### Estrutura de cada diagnóstico

Cada entrada segue o schema existente, com campos obrigatórios preenchidos:
- `cid` — código CID-10
- `nome` — nome canônico
- `sinonimos` — array com termos de busca (abreviações, termos leigos, nomes alternativos)
- `redFlags` — sinais de alarme com critérios objetivos (valores, scores, limiares)
- `excluir` — diagnósticos diferenciais relevantes

Relações `TRATA_COM` incluem `dose` (ataque + manutenção), `linha` (1ª/2ª/emergência), `obs` (contraindicações, alertas).

### Medicamentos novos estimados

~20–30 novos medicamentos de emergência: alteplase, labetalol IV, nitroprussiato, heparina não fracionada, noradrenalina, dopamina, flumazenil, N-acetilcisteína, atropina, pralidoxima, morfina IV, entre outros.

---

## 3. Loop de Aprendizado

### Fluxo

```
Médico envia caso clínico
        ↓
Backend gera resposta (OpenRouter + contexto Neo4j verified)
        ↓
Resposta salva no PostgreSQL (tabela messages — já existe)
        ↓
[NOVO] Extrator LLM roda async (não bloqueia resposta ao médico)
        ↓
Entidades extraídas → nós/relações com status:"pending" no Neo4j
        ↓
Admin acessa /admin/knowledge → revisa sugestões pendentes
        ↓
Aprova → status:"verified" (entra no contexto clínico)
Rejeita → nó/relação removida
```

### Schema Neo4j — propriedade status

Todos os nós (`Diagnostico`, `Medicamento`, `RedFlag`) e relações (`TRATA_COM`) recebem:

```
status: "verified" | "pending"
createdAt: ISO timestamp
sourceSessionId: string | null   // null = seed original
approvedBy: userId | null
approvedAt: ISO timestamp | null
```

**Regra de contexto:** a query que alimenta o LLM filtra `WHERE n.status = "verified"`. Nós `pending` são invisíveis ao raciocínio clínico.

### Migration do seed existente

Script de migration adiciona `status: "verified"` em todos os nós/relações já existentes no Neo4j. O `seed-neo4j.js` passa a setar `status: "verified"` em todos os `MERGE/SET`.

### Extrator LLM

Novo módulo `src/services/knowledge-extractor.js`:

1. Acionado após salvar a resposta no PostgreSQL (evento interno, não bloqueia request).
2. Chama OpenRouter com prompt de extração estruturada:
   ```
   Dado este texto clínico, extraia em JSON:
   - diagnósticos: [{nome, cid?, sinonimos[], redFlags[], excluir[]}]
   - medicamentos: [{nome, classe?, apresentacoes[], viaAdmin?}]
   - relacoes: [{diagnostico, medicamento, dose, linha, obs?}]
   Retorne apenas entidades não presentes na lista de nomes fornecida.
   ```
3. Valida o JSON retornado contra schema (Zod ou validação manual).
4. Para cada entidade válida: verifica se já existe no Neo4j (pelo nome); se não, cria com `status:"pending"`.

### Tela de Admin — `/admin/knowledge`

**Aba Pendentes:**
- Lista de nós/relações `pending` ordenados por `createdAt` desc
- Para cada item: tipo (Diagnóstico / Medicamento / Relação), conteúdo proposto, link para a sessão de origem
- Botões: **Aprovar** (seta `status:"verified"`) | **Rejeitar** (remove o nó/relação)
- Ação em lote: aprovar/rejeitar selecionados

**Aba Verificados:**
- Contadores: total de diagnósticos, medicamentos, red flags, relações verificados
- Listagem somente leitura — sem edição inline nesta versão

### Rastreabilidade

- Cada nó `pending` guarda `sourceSessionId` — permite abrir a resposta original que gerou a sugestão.
- Após aprovação: `approvedBy` (userId) + `approvedAt` ficam no nó para auditoria.
- Rejeições não são logadas (sem overhead de tabela extra nesta versão).

---

## 4. O que não está no escopo

- Edição inline de nós verificados (somente criação via seed ou aprovação de pending)
- Versionamento de nós (histórico de mudanças no grafo)
- Extração automática de PDFs/guidelines externos
- Score de confiança nas sugestões do extrator

---

## 5. Sequência de implementação sugerida

1. Expandir `clinical-data.js` com diagnósticos UPA e rodar seed
2. Migration Neo4j: adicionar `status:"verified"` nos nós existentes
3. Atualizar query de contexto para filtrar `status:"verified"`
4. Implementar `knowledge-extractor.js` (extração async + persistência pending)
5. Implementar rotas de admin (`GET /admin/knowledge/pending`, `POST /admin/knowledge/:id/approve`, `DELETE /admin/knowledge/:id`)
6. Implementar frontend `/admin/knowledge` (duas abas)

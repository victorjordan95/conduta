# Modo Plantão e fontes/versionamento Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Entregar um painel de Modo Plantão com busca local por protocolos/calculadoras e um cartão reutilizável de fontes/versionamento nas páginas clínicas.

**Architecture:** O Modo Plantão será um componente React controlado localmente, alimentado por um índice derivado dos arrays estáticos existentes e integrado ao Dashboard. Fontes/versionamento serão apresentados por um componente sem estado, recebendo metadados dos objetos clínicos; nenhum endpoint, estado global ou fluxo de autenticação será alterado.

**Tech Stack:** React 18, React Router, Vitest, Testing Library, SCSS Modules, Vite.

## Global Constraints

- Não criar endpoint, persistência adicional ou geração por IA.
- Não alterar doses, metas ou condutas clínicas nesta implementação.
- Não fabricar links quando a URL de referência não existir.
- O conteúdo é apoio à decisão e não substitui julgamento profissional ou protocolo institucional.
- Preservar mudanças locais não relacionadas e não adicionar arquivos fora do escopo.

---

### Task 1: Índice local de ferramentas clínicas

**Files:**
- Create: `frontend/src/utils/clinicalSearch.js`
- Test: `frontend/src/__tests__/clinicalSearch.test.js`

**Interfaces:**
- Consumes: `protocolos` de `frontend/src/data/protocolos.js`, `calculadoras` de `frontend/src/data/calculadoras.js` e `CATEGORIAS` de `frontend/src/components/CategoriaProtocolo.jsx`.
- Produces: `buildClinicalSearchIndex()` retornando itens `{ id, tipo, titulo, descricao, categoria, categoriaLabel, href }` e `searchClinicalTools(index, query)` retornando os itens ordenados na mesma ordem do índice.

- [ ] **Step 1: Write the failing test**

```js
import { describe, expect, it } from 'vitest';
import { buildClinicalSearchIndex, searchClinicalTools } from '../utils/clinicalSearch';

describe('clinicalSearch', () => {
  it('cria links locais para protocolos e calculadoras', () => {
    const index = buildClinicalSearchIndex();
    expect(index).toEqual(expect.arrayContaining([
      expect.objectContaining({ tipo: 'protocolo', href: '/protocolos/sri' }),
      expect.objectContaining({ tipo: 'calculadora', href: '/calculadoras/imc' }),
    ]));
  });

  it('busca sem diferenciar acentos, caixa ou categoria', () => {
    const results = searchClinicalTools(buildClinicalSearchIndex(), 'via aerea');
    expect(results.length).toBeGreaterThan(0);
    expect(results.some((item) => item.tipo === 'protocolo')).toBe(true);
  });

  it('retorna todos os itens para uma busca vazia e nenhum para termo ausente', () => {
    const index = buildClinicalSearchIndex();
    expect(searchClinicalTools(index, '')).toHaveLength(index.length);
    expect(searchClinicalTools(index, 'termo inexistente')).toEqual([]);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm --prefix frontend test -- src/__tests__/clinicalSearch.test.js --run`

Expected: FAIL because `frontend/src/utils/clinicalSearch.js` does not exist.

- [ ] **Step 3: Write minimal implementation**

```js
import { protocolos } from '../data/protocolos';
import { calculadoras } from '../data/calculadoras';
import { CATEGORIAS } from '../components/CategoriaProtocolo';

export function normalizarClinicalSearch(value) {
  return String(value ?? '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
}

export function buildClinicalSearchIndex(
  protocolosData = protocolos,
  calculadorasData = calculadoras,
  categorias = CATEGORIAS,
) {
  return [
    ...protocolosData.map((item) => ({
      id: `protocolo-${item.slug}`,
      tipo: 'protocolo',
      titulo: item.titulo,
      descricao: `Protocolo de ${item.tags.join(', ')}`,
      categoria: item.categoria,
      categoriaLabel: categorias[item.categoria]?.label ?? item.categoria,
      href: `/protocolos/${item.slug}`,
    })),
    ...calculadorasData.map((item) => ({
      id: `calculadora-${item.slug}`,
      tipo: 'calculadora',
      titulo: item.titulo,
      descricao: item.descricao,
      categoria: 'calculadora',
      categoriaLabel: 'Calculadora clínica',
      href: `/calculadoras/${item.slug}`,
    })),
  ];
}

export function searchClinicalTools(index, query) {
  const term = normalizarClinicalSearch(query.trim());
  if (!term) return index;
  return index.filter((item) => normalizarClinicalSearch(
    `${item.titulo} ${item.descricao} ${item.categoriaLabel}`,
  ).includes(term));
}
```

Usar defaults importados no módulo para que `buildClinicalSearchIndex()` possa ser chamado sem argumentos pelo componente, mas manter argumentos opcionais para testes unitários isolados.

- [ ] **Step 4: Run test to verify it passes**

Run: `npm --prefix frontend test -- src/__tests__/clinicalSearch.test.js --run`

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add frontend/src/utils/clinicalSearch.js frontend/src/__tests__/clinicalSearch.test.js
git commit -m "feat: criar indice local de ferramentas clinicas"
```

### Task 2: Modo Plantão no Dashboard

**Files:**
- Create: `frontend/src/components/PlantaoQuickActions.jsx`
- Create: `frontend/src/components/PlantaoQuickActions.module.scss`
- Modify: `frontend/src/pages/Dashboard.jsx`
- Modify: `frontend/src/pages/Dashboard.module.scss`
- Test: `frontend/src/__tests__/PlantaoQuickActions.test.jsx`

**Interfaces:**
- Consumes: `buildClinicalSearchIndex`/`searchClinicalTools`, `onNewCase` e o roteador atual.
- Produces: componente `PlantaoQuickActions({ onNewCase })` com busca, ações e links navegáveis.

- [ ] **Step 1: Write the failing test**

```jsx
it('renderiza ações principais e links clínicos', () => {
  render(<PlantaoQuickActions onNewCase={vi.fn()} />);
  expect(screen.getByRole('button', { name: /novo caso/i })).toBeInTheDocument();
  expect(screen.getByRole('link', { name: /protocolos/i })).toHaveAttribute('href', '/protocolos');
  expect(screen.getByRole('link', { name: /calculadoras/i })).toHaveAttribute('href', '/calculadoras');
});

it('filtra um protocolo pela busca e mostra estado sem resultado', async () => {
  render(<PlantaoQuickActions onNewCase={vi.fn()} />);
  const search = screen.getByRole('searchbox', { name: /buscar ferramenta/i });
  await userEvent.type(search, 'intubação');
  expect(screen.getByRole('link', { name: /sequência rápida de intubação/i })).toBeInTheDocument();
  await userEvent.clear(search);
  await userEvent.type(search, 'xyz inexistente');
  expect(screen.getByRole('status')).toHaveTextContent(/nenhum protocolo ou calculadora/i);
});

it('foca a busca com barra ou Ctrl/Cmd+K fora de campos editáveis', () => {
  render(<PlantaoQuickActions onNewCase={vi.fn()} />);
  const search = screen.getByRole('searchbox', { name: /buscar ferramenta/i });
  fireEvent.keyDown(document, { key: '/' });
  expect(search).toHaveFocus();
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm --prefix frontend test -- src/__tests__/PlantaoQuickActions.test.jsx --run`

Expected: FAIL because the component has not been created.

- [ ] **Step 3: Write minimal implementation**

Implement a `<section aria-label="Modo plantão">` with:

- button `+ Novo caso` calling `onNewCase`;
- links HTML para `/protocolos` e `/calculadoras`;
- `<div role="search">` containing a labeled `input type="search"` and `kbd` with `/`;
- resultados renderizados como links HTML com rótulos de tipo/categoria;
- `role="status"` for the no-results state;
- `useEffect` listener for `/` and `Ctrl/Cmd+K`, ignoring `INPUT`, `TEXTAREA`, `SELECT` and content-editable elements;
- CSS Modules with existing design tokens, responsive one-column layout below 620px and visible `:focus-visible` outlines.

In `Dashboard.jsx`, render the component after the mobile header and before the empty/active-session conditional. Pass `onNewCase={handleCreateNewCase}`. Remove no existing action; the existing empty-state button and `Ctrl+N` behavior remain intact.

- [ ] **Step 4: Run test to verify it passes**

Run: `npm --prefix frontend test -- src/__tests__/PlantaoQuickActions.test.jsx --run`

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add frontend/src/components/PlantaoQuickActions.jsx frontend/src/components/PlantaoQuickActions.module.scss frontend/src/pages/Dashboard.jsx frontend/src/pages/Dashboard.module.scss frontend/src/__tests__/PlantaoQuickActions.test.jsx
git commit -m "feat: adicionar modo plantao ao dashboard"
```

### Task 3: Cartão reutilizável de fonte e versão

**Files:**
- Create: `frontend/src/components/SourceVersionCard.jsx`
- Create: `frontend/src/components/SourceVersionCard.module.scss`
- Test: `frontend/src/__tests__/SourceVersionCard.test.jsx`

**Interfaces:**
- Consumes: `referencia`, `atualizadoEm`, `referenciaUrl` e `notaSeguranca` opcionais.
- Produces: `SourceVersionCard({ referencia, atualizadoEm, referenciaUrl, notaSeguranca })` sem efeitos colaterais.

- [ ] **Step 1: Write the failing test**

```jsx
it('exibe referência, última revisão e link externo', () => {
  render(<SourceVersionCard
    referencia="Fonte clínica"
    atualizadoEm="Julho de 2026"
    referenciaUrl="https://example.com/fonte"
    notaSeguranca="Use como apoio à decisão."
  />);
  expect(screen.getByText('Fonte clínica')).toBeInTheDocument();
  expect(screen.getByText(/julho de 2026/i)).toBeInTheDocument();
  expect(screen.getByRole('link', { name: /abrir fonte clínica/i })).toHaveAttribute('href', 'https://example.com/fonte');
  expect(screen.getByText(/apoio à decisão/i)).toBeInTheDocument();
});

it('não cria link quando a URL está ausente', () => {
  render(<SourceVersionCard referencia="Referência textual" atualizadoEm="Julho de 2026" />);
  expect(screen.getByText('Referência textual')).toBeInTheDocument();
  expect(screen.queryByRole('link')).not.toBeInTheDocument();
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm --prefix frontend test -- src/__tests__/SourceVersionCard.test.jsx --run`

Expected: FAIL because the component has not been created.

- [ ] **Step 3: Write minimal implementation**

Render a `<section aria-label="Fonte e versão">` with the reference text, an optional metadata row, an optional external link using `target="_blank"` and `rel="noreferrer"`, and a default safety note when `notaSeguranca` is omitted. Omit empty fields rather than rendering blank labels.

- [ ] **Step 4: Run test to verify it passes**

Run: `npm --prefix frontend test -- src/__tests__/SourceVersionCard.test.jsx --run`

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add frontend/src/components/SourceVersionCard.jsx frontend/src/components/SourceVersionCard.module.scss frontend/src/__tests__/SourceVersionCard.test.jsx
git commit -m "feat: adicionar cartao de fonte clinica"
```

### Task 4: Metadados e integração nas páginas clínicas

**Files:**
- Modify: `frontend/src/data/protocolos.js`
- Modify: `frontend/src/data/calculadoras.js`
- Modify: `frontend/src/pages/ProtocoloDetalhe.jsx`
- Modify: `frontend/src/pages/ProtocoloDetalhe.module.scss`
- Modify: `frontend/src/pages/CalculadoraDetalhe.jsx`
- Modify: `frontend/src/pages/CalculadoraDetalhe.module.scss`
- Test: `frontend/src/__tests__/ProtocoloDetalhe.test.jsx`
- Test: `frontend/src/__tests__/CalculadoraDetalhe.test.jsx`

**Interfaces:**
- Consumes: `SourceVersionCard` e os metadados estáticos dos dados clínicos.
- Produces: detalhes de protocolo e calculadora exibindo fonte, revisão e limitação sem alterar o cálculo ou as fases clínicas.

- [ ] **Step 1: Write the failing tests**

```jsx
it('exibe fonte e última revisão no protocolo', () => {
  renderDetalhe('sri');
  expect(screen.getByRole('region', { name: /fonte e versão/i })).toBeInTheDocument();
  expect(screen.getByText(/última revisão editorial/i)).toBeInTheDocument();
  expect(screen.getByText(/julho de 2026/i)).toBeInTheDocument();
});

it('exibe fonte e última revisão na calculadora', () => {
  renderSlug('imc');
  expect(screen.getByRole('region', { name: /fonte e versão/i })).toBeInTheDocument();
  expect(screen.getByText(/última revisão editorial/i)).toBeInTheDocument();
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npm --prefix frontend test -- src/__tests__/ProtocoloDetalhe.test.jsx src/__tests__/CalculadoraDetalhe.test.jsx --run`

Expected: FAIL because the reusable source card is not mounted on either detail page.

- [ ] **Step 3: Write minimal implementation**

Add `atualizadoEm: 'Julho de 2026'` and a short `notaSeguranca` to the calculator entries. For protocols, rename the current literal to `protocolosBase` and export `protocolosBase.map((protocolo) => ({ ...protocolo, atualizadoEm: 'Julho de 2026', notaSeguranca: 'Confira doses e o protocolo institucional antes de usar.' }))`; preserve all existing clinical fields and `getProtocolo` behavior.

Mount `SourceVersionCard` after the protocol phases and before the disclaimer. On calculators, replace the duplicated reference block inside `notes` with the reusable card while keeping formula and limitations visible. Pass the existing calculator `referenciaUrl`; pass no fabricated URL for protocols.

Add only the styles needed by the new component and the surrounding page spacing; retain current responsive behavior.

- [ ] **Step 4: Run tests to verify they pass**

Run: `npm --prefix frontend test -- src/__tests__/ProtocoloDetalhe.test.jsx src/__tests__/CalculadoraDetalhe.test.jsx --run`

Expected: PASS, including all existing calculation, validation, phase, alert and redirect assertions.

- [ ] **Step 5: Commit**

```bash
git add frontend/src/data/protocolos.js frontend/src/data/calculadoras.js frontend/src/pages/ProtocoloDetalhe.jsx frontend/src/pages/ProtocoloDetalhe.module.scss frontend/src/pages/CalculadoraDetalhe.jsx frontend/src/pages/CalculadoraDetalhe.module.scss frontend/src/__tests__/ProtocoloDetalhe.test.jsx frontend/src/__tests__/CalculadoraDetalhe.test.jsx
git commit -m "feat: exibir fontes e versao dos conteudos clinicos"
```

### Task 5: Verificação integrada

**Files:**
- Modify only files required by a failing test or build error from Tasks 1–4.

- [ ] **Step 1: Run focused regression tests**

Run: `npm --prefix frontend test -- src/__tests__/clinicalSearch.test.js src/__tests__/PlantaoQuickActions.test.jsx src/__tests__/SourceVersionCard.test.jsx src/__tests__/ProtocoloDetalhe.test.jsx src/__tests__/CalculadoraDetalhe.test.jsx --run`

Expected: all focused tests pass.

- [ ] **Step 2: Run the full frontend test suite**

Run: `npm --prefix frontend test -- --run`

Expected: all new tests and all existing unrelated tests pass; if the pre-existing LandingPage `/login` versus `/register` assertion remains, report it separately without changing unrelated behavior.

- [ ] **Step 3: Run the production build**

Run: `npm --prefix frontend run build`

Expected: Vite production build completes successfully.

- [ ] **Step 4: Inspect the final diff**

Run: `git status --short; git diff HEAD~4 --stat`

Expected: only the approved feature files and plan/spec commits are present in the feature history; unrelated local modifications remain unstaged.

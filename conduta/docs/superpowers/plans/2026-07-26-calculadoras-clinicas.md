# Calculadoras Clínicas Públicas Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a public, deterministic calculator library that gives unauthenticated visitors an immediate, reproducible utility and a clear path into Conduta.

**Architecture:** Keep calculator definitions and formulas separate. `frontend/src/data/calculadoras.js` owns public metadata, labels, references, and the calculator registry; `frontend/src/utils/calculadoras.js` owns pure validation and mathematical functions. Generic React list/detail pages render the registry and invoke only the selected deterministic calculator. Routes are public and independent of `AuthContext`.

**Tech Stack:** React 18, React Router 6, Vite, SCSS modules, Vitest, Testing Library.

## Global Constraints

- No LLM or network call is used to calculate results.
- First release contains only IMC and superfície corporal (Mosteller).
- Inputs accept only positive finite numbers; invalid or missing values show an actionable validation message.
- Every result displays the formula name, unit, reference, limitations, and the clinical-support disclaimer.
- The calculator must not receive, persist, or transmit patient identifiers.
- Protocol content remains unchanged and `/protocolos` remains admin-only until the separate clinical review is complete.
- Existing unrelated worktree changes must be preserved.
- Every production function is covered by a failing test before implementation.

---

### Task 1: Deterministic calculator domain

**Files:**
- Create: `frontend/src/utils/calculadoras.js`
- Create: `frontend/src/data/calculadoras.js`
- Test: `frontend/src/__tests__/calculadoras.data.test.js`
- Test: `frontend/src/__tests__/calculadoras.utils.test.js`

**Interfaces:**
- `calcularImc({ pesoKg, alturaCm }) -> { valor, classificacao }`
- `calcularSuperficieCorporal({ pesoKg, alturaCm }) -> { valor }`
- `getCalculadora(slug) -> calculator metadata | null`
- `calculadoras -> Array<calculator metadata>`

- [ ] **Step 1: Write failing unit tests**

```js
import { describe, expect, it } from 'vitest';
import {
  calcularImc,
  calcularSuperficieCorporal,
  validarEntradas,
} from '../utils/calculadoras';

describe('calculadoras determinísticas', () => {
  it('calcula IMC e classificação para valores válidos', () => {
    expect(calcularImc({ pesoKg: 70, alturaCm: 175 })).toEqual({
      valor: 22.86,
      classificacao: 'Eutrofia',
    });
  });

  it('calcula superfície corporal pela fórmula de Mosteller', () => {
    expect(calcularSuperficieCorporal({ pesoKg: 70, alturaCm: 175 })).toEqual({
      valor: 1.85,
    });
  });

  it('rejeita peso ou altura ausentes, zero, negativos ou não numéricos', () => {
    expect(() => validarEntradas({ pesoKg: 0, alturaCm: 175 })).toThrow();
    expect(() => validarEntradas({ pesoKg: 70, alturaCm: '175' })).toThrow();
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npm --prefix frontend test -- src/__tests__/calculadoras.utils.test.js src/__tests__/calculadoras.data.test.js`

Expected: FAIL because the calculator modules do not exist.

- [ ] **Step 3: Implement the minimal deterministic domain**

Implement `validarEntradas` with `Number.isFinite` and `> 0` checks. Use:

```js
const imc = pesoKg / ((alturaCm / 100) ** 2);
const superficieCorporal = Math.sqrt((pesoKg * alturaCm) / 3600);
```

Round displayed numerical values to two decimals. Classify adult IMC using the explicitly displayed ranges: `< 18.5` Baixo peso, `18.5–24.9` Eutrofia, `25–29.9` Sobrepeso, `>= 30` Obesidade. The domain functions must not read browser state or format HTML.

Create registry metadata with slug, title, short description, fields, units, formula label, reference, limitation, and a `calculate` function reference. Include only `imc` and `superficie-corporal`.

- [ ] **Step 4: Run tests to verify they pass**

Run: `npm --prefix frontend test -- src/__tests__/calculadoras.utils.test.js src/__tests__/calculadoras.data.test.js`

Expected: PASS.

- [ ] **Step 5: Commit the domain layer**

```bash
git add frontend/src/utils/calculadoras.js frontend/src/data/calculadoras.js frontend/src/__tests__/calculadoras.data.test.js frontend/src/__tests__/calculadoras.utils.test.js
git commit -m "feat: add deterministic clinical calculator domain"
```

### Task 2: Public calculator index

**Files:**
- Create: `frontend/src/pages/Calculadoras.jsx`
- Create: `frontend/src/pages/Calculadoras.module.scss`
- Test: `frontend/src/__tests__/Calculadoras.test.jsx`

**Interfaces:**
- Consumes `calculadoras` from `data/calculadoras.js`.
- Produces links `/calculadoras/:slug` for every registered calculator.

- [ ] **Step 1: Write failing page tests**

```jsx
import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import Calculadoras from '../pages/Calculadoras';
import { calculadoras } from '../data/calculadoras';

describe('Calculadoras (lista pública)', () => {
  it('renderiza o título e todos os cards registrados', () => {
    render(<MemoryRouter><Calculadoras /></MemoryRouter>);
    expect(screen.getByRole('heading', { name: /Calculadoras clínicas/i })).toBeInTheDocument();
    expect(screen.getAllByTestId('calculadora-card')).toHaveLength(calculadoras.length);
  });

  it('aponta cada card para o slug correto', () => {
    render(<MemoryRouter><Calculadoras /></MemoryRouter>);
    calculadoras.forEach((calculator) => {
      expect(screen.getByRole('link', { name: new RegExp(calculator.titulo, 'i') }))
        .toHaveAttribute('href', `/calculadoras/${calculator.slug}`);
    });
  });
});
```

- [ ] **Step 2: Run the page test to verify it fails**

Run: `npm --prefix frontend test -- src/__tests__/Calculadoras.test.jsx`

Expected: FAIL because the page does not exist.

- [ ] **Step 3: Implement the public index page**

Render a header, concise acquisition-oriented explanation, disclaimer, and one card per registry entry. Use the existing Conduta tokens and the same max-width/card/focus conventions as `Protocolos.module.scss`. Do not expose admin controls or require `AuthContext`.

- [ ] **Step 4: Run the page test to verify it passes**

Run: `npm --prefix frontend test -- src/__tests__/Calculadoras.test.jsx`

Expected: PASS.

- [ ] **Step 5: Commit the public index**

```bash
git add frontend/src/pages/Calculadoras.jsx frontend/src/pages/Calculadoras.module.scss frontend/src/__tests__/Calculadoras.test.jsx
git commit -m "feat: add public calculator index"
```

### Task 3: Generic calculator detail form

**Files:**
- Create: `frontend/src/pages/CalculadoraDetalhe.jsx`
- Create: `frontend/src/pages/CalculadoraDetalhe.module.scss`
- Test: `frontend/src/__tests__/CalculadoraDetalhe.test.jsx`

**Interfaces:**
- Consumes `getCalculadora(slug)` and its field metadata.
- Displays the result returned by the registry calculator without persisting inputs.

- [ ] **Step 1: Write failing detail tests**

```jsx
import { describe, expect, it } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import CalculadoraDetalhe from '../pages/CalculadoraDetalhe';

function renderSlug(slug) {
  return render(
    <MemoryRouter initialEntries={[`/calculadoras/${slug}`]}>
      <Routes><Route path="/calculadoras/:slug" element={<CalculadoraDetalhe />} /></Routes>
    </MemoryRouter>
  );
}

describe('CalculadoraDetalhe', () => {
  it('calcula e exibe IMC sem login', () => {
    renderSlug('imc');
    fireEvent.change(screen.getByLabelText(/peso/i), { target: { value: '70' } });
    fireEvent.change(screen.getByLabelText(/altura/i), { target: { value: '175' } });
    fireEvent.click(screen.getByRole('button', { name: /calcular/i }));
    expect(screen.getByText('22,86')).toBeInTheDocument();
    expect(screen.getByText(/Eutrofia/i)).toBeInTheDocument();
  });

  it('mostra validação em entradas inválidas', () => {
    renderSlug('imc');
    fireEvent.click(screen.getByRole('button', { name: /calcular/i }));
    expect(screen.getByRole('alert')).toHaveTextContent(/preencha/i);
  });
});
```

- [ ] **Step 2: Run the detail test to verify it fails**

Run: `npm --prefix frontend test -- src/__tests__/CalculadoraDetalhe.test.jsx`

Expected: FAIL because the detail page does not exist.

- [ ] **Step 3: Implement the generic form**

Read the slug from `useParams`, redirect unknown slugs to `/calculadoras`, render fields from metadata, parse decimal comma and decimal point inputs, validate on submit, and render the result in a labelled result region. Show the formula, reference, limitations, and a clinical-support disclaimer below the result. Keep state local to the page and clear it on reload.

- [ ] **Step 4: Run the detail test to verify it passes**

Run: `npm --prefix frontend test -- src/__tests__/CalculadoraDetalhe.test.jsx`

Expected: PASS.

- [ ] **Step 5: Commit the detail flow**

```bash
git add frontend/src/pages/CalculadoraDetalhe.jsx frontend/src/pages/CalculadoraDetalhe.module.scss frontend/src/__tests__/CalculadoraDetalhe.test.jsx
git commit -m "feat: add public calculator detail flow"
```

### Task 4: Routing and acquisition entry points

**Files:**
- Modify: `frontend/src/App.jsx`
- Modify: `frontend/src/components/landing/Navbar.jsx`
- Test: `frontend/src/__tests__/App.calculadoras.test.jsx`

**Interfaces:**
- `/calculadoras` renders the public index.
- `/calculadoras/:slug` renders the public detail page.
- `/protocolos` and `/protocolos/:slug` retain `AdminRoute`.

- [ ] **Step 1: Write failing route/entry-point tests**

```jsx
import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import Navbar from '../components/landing/Navbar';

describe('entrada pública das calculadoras', () => {
  it('exibe link público para calculadoras na navegação da landing', () => {
    render(<MemoryRouter><Navbar /></MemoryRouter>);
    expect(screen.getByRole('link', { name: /calculadoras/i }))
      .toHaveAttribute('href', '/calculadoras');
  });
});
```

- [ ] **Step 2: Run the route test to verify it fails**

Run: `npm --prefix frontend test -- src/__tests__/App.calculadoras.test.jsx`

Expected: FAIL because the navigation link and routes do not exist.

- [ ] **Step 3: Add public routes and navigation**

Import both calculator pages into `App.jsx` and add routes before the catch-all without `PrivateRoute` or `AdminRoute`. Add a single `Calculadoras` link to the landing navbar. Do not alter protocol route protection in this task.

- [ ] **Step 4: Run the route test and the full frontend suite**

Run: `npm --prefix frontend test -- src/__tests__/App.calculadoras.test.jsx`

Expected: PASS.

Then run: `npm --prefix frontend test`

Expected: all existing and new tests pass.

- [ ] **Step 5: Build the frontend**

Run: `npm --prefix frontend run build`

Expected: Vite production build completes successfully.

- [ ] **Step 6: Commit routing and verification**

```bash
git add frontend/src/App.jsx frontend/src/components/landing/Navbar.jsx frontend/src/__tests__/App.calculadoras.test.jsx
git commit -m "feat: expose calculators publicly"
```

## Protocols: separate follow-up

Protocol revision is intentionally excluded from this implementation plan. Before changing or exposing the current emergency protocols, create a separate review plan covering the ten protocols, their evidence sources, Brazilian availability, adult/pediatric/pregnancy scope, version metadata, reviewer approval, and publication gate. Until then, keep their existing admin-only routes and do not use the calculator launch as evidence that the protocol library is clinically approved.

## Verification checklist

- [ ] Unit tests demonstrate invalid-input rejection and exact formulas.
- [ ] Page tests demonstrate public rendering without authentication.
- [ ] Existing protocol tests remain green.
- [ ] `npm --prefix frontend run build` passes.
- [ ] No LLM/network call is present in calculator execution.
- [ ] No calculator input is persisted or sent to the backend.
- [ ] Protocol routes remain admin-only.

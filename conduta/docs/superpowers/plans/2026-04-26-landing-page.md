# Landing Page — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Criar a landing page pública do Conduta com 8 seções — hero emocional, demo animada de chat clínico, features, prova social, preços e CTA final.

**Architecture:** Nova página `LandingPage` em React com seções como componentes separados em `components/landing/`. Rota `/` passa a ser smart: exibe LandingPage para visitante anônimo e Dashboard para usuário autenticado. CTAs redirecionam para `/login`.

**Tech Stack:** React 18, React Router DOM v6, SCSS Modules, Vite, Vitest + Testing Library

---

## File Map

| Ação | Arquivo |
|---|---|
| Criar | `frontend/src/pages/LandingPage.jsx` |
| Criar | `frontend/src/pages/LandingPage.module.scss` |
| Criar | `frontend/src/components/landing/Navbar.jsx` |
| Criar | `frontend/src/components/landing/HeroSection.jsx` |
| Criar | `frontend/src/components/landing/DorSection.jsx` |
| Criar | `frontend/src/components/landing/DemoSection.jsx` |
| Criar | `frontend/src/components/landing/DemoSection.module.scss` |
| Criar | `frontend/src/components/landing/FeaturesSection.jsx` |
| Criar | `frontend/src/components/landing/ProvaSection.jsx` |
| Criar | `frontend/src/components/landing/PrecosSection.jsx` |
| Criar | `frontend/src/components/landing/FaqSection.jsx` |
| Criar | `frontend/src/components/landing/CtaFinalSection.jsx` |
| Criar | `frontend/src/components/landing/landing.module.scss` |
| Criar | `frontend/src/__tests__/LandingPage.test.jsx` |
| Modificar | `frontend/src/App.jsx` — rota `/` smart (landing vs dashboard) |

---

## Task 1: Rota raiz smart (landing para anônimo, dashboard para autenticado)

**Files:**
- Modify: `frontend/src/App.jsx`
- Test: `frontend/src/__tests__/LandingPage.test.jsx`

- [ ] **Step 1: Criar arquivo de teste**

```jsx
// frontend/src/__tests__/LandingPage.test.jsx
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

// Stub mínimo para o componente — não existe ainda, import vai falhar proposital
// Roda depois do Task 2
```

> Nota: o teste real será escrito no Task 2 após criar o componente. Por ora apenas crie o arquivo vazio para reservar o caminho.

- [ ] **Step 2: Atualizar App.jsx**

```jsx
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import AdminKnowledge from './pages/AdminKnowledge';
import LandingPage from './pages/LandingPage';

function PrivateRoute({ children }) {
  const { token } = useAuth();
  return token ? children : <Navigate to="/login" replace />;
}

function AdminRoute({ children }) {
  const { token, user } = useAuth();
  if (!token) return <Navigate to="/login" replace />;
  if (user?.role !== 'admin') return <Navigate to="/" replace />;
  return children;
}

function RootRoute() {
  const { token } = useAuth();
  return token ? <Dashboard /> : <LandingPage />;
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<RootRoute />} />
          <Route path="/login" element={<Login />} />
          <Route
            path="/admin/knowledge"
            element={
              <AdminRoute>
                <AdminKnowledge />
              </AdminRoute>
            }
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
```

> LandingPage ainda não existe — o app vai quebrar até o Task 2. Isso é esperado.

- [ ] **Step 3: Commit**

```bash
git add frontend/src/App.jsx frontend/src/__tests__/LandingPage.test.jsx
git commit -m "feat: rota raiz smart — landing para anônimo, dashboard para autenticado"
```

---

## Task 2: Scaffold da LandingPage e CSS compartilhado

**Files:**
- Create: `frontend/src/pages/LandingPage.jsx`
- Create: `frontend/src/pages/LandingPage.module.scss`
- Create: `frontend/src/components/landing/landing.module.scss`
- Test: `frontend/src/__tests__/LandingPage.test.jsx`

- [ ] **Step 1: Escrever teste que falha**

```jsx
// frontend/src/__tests__/LandingPage.test.jsx
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import LandingPage from '../pages/LandingPage';

function renderLanding() {
  return render(
    <MemoryRouter>
      <LandingPage />
    </MemoryRouter>
  );
}

describe('LandingPage', () => {
  it('renderiza sem erros', () => {
    renderLanding();
    expect(document.body).toBeTruthy();
  });

  it('exibe headline do hero', () => {
    renderLanding();
    expect(screen.getByText(/aquela dúvida clínica/i)).toBeInTheDocument();
  });

  it('exibe link de cadastro no hero', () => {
    renderLanding();
    const links = screen.getAllByRole('link', { name: /começar grátis/i });
    expect(links.length).toBeGreaterThan(0);
    expect(links[0]).toHaveAttribute('href', '/login');
  });
});
```

- [ ] **Step 2: Rodar e verificar falha**

```bash
cd frontend && npx vitest run src/__tests__/LandingPage.test.jsx
```

Expected: FAIL — `Cannot find module '../pages/LandingPage'`

- [ ] **Step 3: Criar CSS compartilhado de seções**

```scss
// frontend/src/components/landing/landing.module.scss
@use '../../styles/variables' as *;

.section {
  padding: 80px 24px;
  max-width: 1100px;
  margin: 0 auto;
}

.sectionLabel {
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 2px;
  text-transform: uppercase;
  color: $color-accent;
  margin-bottom: 16px;
}

.sectionTitle {
  font-size: 32px;
  font-weight: 800;
  color: $color-text-primary;
  line-height: 1.25;
  margin-bottom: 12px;

  @media (max-width: 640px) {
    font-size: 24px;
  }
}

.sectionSubtitle {
  font-size: 16px;
  color: $color-text-secondary;
  line-height: 1.6;
  max-width: 560px;
}

.ctaButton {
  display: inline-block;
  background: $color-accent;
  color: white;
  padding: 14px 32px;
  border-radius: $border-radius;
  font-weight: 700;
  font-size: 15px;
  text-decoration: none;
  transition: background 0.15s;

  &:hover {
    background: $color-accent-hover;
  }
}

.ctaButtonDark {
  display: inline-block;
  background: $color-sidebar;
  color: white;
  padding: 14px 32px;
  border-radius: $border-radius;
  font-weight: 700;
  font-size: 15px;
  text-decoration: none;
  transition: background 0.15s;

  &:hover {
    background: $color-sidebar-hover;
  }
}

.ctaMeta {
  font-size: 13px;
  color: $color-text-secondary;
  margin-top: 12px;
}
```

- [ ] **Step 4: Criar LandingPage.module.scss**

```scss
// frontend/src/pages/LandingPage.module.scss
@use '../styles/variables' as *;

.page {
  font-family: $font-family;
  color: $color-text-primary;
  background: $color-bg;
}
```

- [ ] **Step 5: Criar LandingPage.jsx (scaffold)**

```jsx
// frontend/src/pages/LandingPage.jsx
import styles from './LandingPage.module.scss';

export default function LandingPage() {
  return (
    <div className={styles.page}>
      <p>Landing page — em construção</p>
    </div>
  );
}
```

- [ ] **Step 6: Rodar e verificar que passa**

```bash
cd frontend && npx vitest run src/__tests__/LandingPage.test.jsx
```

Expected: FAIL ainda (headline e link não existem). Normal — vamos implementar seção por seção.

- [ ] **Step 7: Commit do scaffold**

```bash
git add frontend/src/pages/LandingPage.jsx frontend/src/pages/LandingPage.module.scss frontend/src/components/landing/landing.module.scss
git commit -m "feat: scaffold LandingPage e CSS compartilhado"
```

---

## Task 3: Navbar

**Files:**
- Create: `frontend/src/components/landing/Navbar.jsx`

- [ ] **Step 1: Criar Navbar.jsx**

```jsx
// frontend/src/components/landing/Navbar.jsx
import { Link } from 'react-router-dom';
import styles from './landing.module.scss';
import navStyles from './Navbar.module.scss';

export default function Navbar() {
  return (
    <nav className={navStyles.nav}>
      <div className={navStyles.inner}>
        <Link to="/" className={navStyles.brand}>
          <span className={navStyles.dot} />
          Conduta
        </Link>
        <div className={navStyles.actions}>
          <Link to="/login" className={navStyles.loginLink}>Entrar</Link>
          <Link to="/login" className={styles.ctaButton} style={{ padding: '8px 20px', fontSize: '13px' }}>
            Começar grátis
          </Link>
        </div>
      </div>
    </nav>
  );
}
```

- [ ] **Step 2: Criar Navbar.module.scss**

```scss
// frontend/src/components/landing/Navbar.module.scss
@use '../../styles/variables' as *;

.nav {
  position: sticky;
  top: 0;
  z-index: 100;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(8px);
  border-bottom: 1px solid $color-border;
}

.inner {
  max-width: 1100px;
  margin: 0 auto;
  padding: 0 24px;
  height: 60px;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.brand {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 800;
  font-size: 16px;
  color: $color-text-primary;
  text-decoration: none;
  letter-spacing: 1px;
  text-transform: uppercase;
}

.dot {
  width: 10px;
  height: 10px;
  background: $color-accent;
  border-radius: 50%;
  flex-shrink: 0;
}

.actions {
  display: flex;
  align-items: center;
  gap: 16px;
}

.loginLink {
  font-size: 13px;
  color: $color-text-secondary;
  text-decoration: none;
  font-weight: 500;

  &:hover {
    color: $color-text-primary;
  }
}
```

- [ ] **Step 3: Adicionar Navbar ao LandingPage**

```jsx
// frontend/src/pages/LandingPage.jsx
import styles from './LandingPage.module.scss';
import Navbar from '../components/landing/Navbar';

export default function LandingPage() {
  return (
    <div className={styles.page}>
      <Navbar />
      <p>Landing page — em construção</p>
    </div>
  );
}
```

- [ ] **Step 4: Commit**

```bash
git add frontend/src/components/landing/Navbar.jsx frontend/src/components/landing/Navbar.module.scss frontend/src/pages/LandingPage.jsx
git commit -m "feat: navbar da landing page"
```

---

## Task 4: Seção 1 — Hero

**Files:**
- Create: `frontend/src/components/landing/HeroSection.jsx`
- Create: `frontend/src/components/landing/HeroSection.module.scss`
- Modify: `frontend/src/pages/LandingPage.jsx`
- Test: `frontend/src/__tests__/LandingPage.test.jsx`

- [ ] **Step 1: Criar HeroSection.jsx**

```jsx
// frontend/src/components/landing/HeroSection.jsx
import { Link } from 'react-router-dom';
import styles from './HeroSection.module.scss';
import shared from './landing.module.scss';

export default function HeroSection() {
  return (
    <section className={styles.hero}>
      <div className={styles.inner}>
        <div className={styles.badge}>Para médicos em formação</div>

        <h1 className={styles.headline}>
          Aquela dúvida clínica<br />
          que você não quer ter<br />
          <span className={styles.accent}>agora tem resposta.</span>
        </h1>

        <p className={styles.sub}>
          Assistente clínico com IA que analisa o caso, sugere conduta e aponta
          red flags — em segundos.
        </p>

        <div className={styles.ctaGroup}>
          <Link to="/login" className={shared.ctaButton}>Começar grátis</Link>
          <span className={shared.ctaMeta}>15 análises/mês · sem cartão</span>
        </div>

        <div className={styles.preview}>
          <div className={styles.previewLabel}>ANÁLISE EM ANDAMENTO</div>
          <div className={styles.previewInput}>
            → Criança, 4 anos, febre há 3 dias, sem foco aparente...
          </div>
          <div className={styles.previewOutput}>
            <div className={styles.outputLine}>
              <span className={styles.success}>✓ Hipótese principal:</span> IVAS viral
            </div>
            <div className={styles.outputLine}>
              <span className={styles.warning}>⚠ Red flag:</span> Febre &gt; 39°C por mais de 5 dias — investigar foco
            </div>
            <div className={styles.outputLine}>
              <span className={styles.muted}>→ Conduta:</span> Antitérmico + reavaliação em 48h
            </div>
            <div className={styles.outputLine}>
              <span className={styles.muted}>→ Encaminhamento:</span> SE febre persistir ou surgir petéquias
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
```

- [ ] **Step 2: Criar HeroSection.module.scss**

```scss
// frontend/src/components/landing/HeroSection.module.scss
@use '../../styles/variables' as *;

.hero {
  background: $color-bg;
  padding: 72px 24px 80px;
  text-align: center;
}

.inner {
  max-width: 720px;
  margin: 0 auto;
}

.badge {
  display: inline-block;
  background: #e8f4f5;
  color: $color-accent;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 1.5px;
  text-transform: uppercase;
  padding: 5px 14px;
  border-radius: 20px;
  margin-bottom: 24px;
}

.headline {
  font-size: 48px;
  font-weight: 800;
  color: $color-text-primary;
  line-height: 1.15;
  margin-bottom: 20px;

  @media (max-width: 640px) {
    font-size: 32px;
  }
}

.accent {
  color: $color-accent;
}

.sub {
  font-size: 18px;
  color: $color-text-secondary;
  line-height: 1.6;
  max-width: 540px;
  margin: 0 auto 32px;

  @media (max-width: 640px) {
    font-size: 15px;
  }
}

.ctaGroup {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  margin-bottom: 48px;
}

.preview {
  background: $color-surface;
  border: 1px solid $color-border;
  border-radius: 12px;
  padding: 20px 24px;
  text-align: left;
  box-shadow: $shadow-md;
  max-width: 560px;
  margin: 0 auto;
}

.previewLabel {
  font-size: 10px;
  font-weight: 600;
  color: $color-text-secondary;
  letter-spacing: 1px;
  text-transform: uppercase;
  margin-bottom: 10px;
}

.previewInput {
  font-size: 13px;
  color: $color-accent;
  font-weight: 600;
  margin-bottom: 12px;
}

.previewOutput {
  background: $color-sidebar;
  border-radius: 8px;
  padding: 14px 16px;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.outputLine {
  font-size: 12px;
  color: $color-text-sidebar;
  line-height: 1.5;
}

.success { color: $color-success; font-weight: 600; }
.warning { color: $color-warning; font-weight: 600; }
.muted   { color: $color-text-sidebar; font-weight: 600; }
```

- [ ] **Step 3: Adicionar HeroSection ao LandingPage e atualizar teste**

```jsx
// frontend/src/pages/LandingPage.jsx
import styles from './LandingPage.module.scss';
import Navbar from '../components/landing/Navbar';
import HeroSection from '../components/landing/HeroSection';

export default function LandingPage() {
  return (
    <div className={styles.page}>
      <Navbar />
      <HeroSection />
    </div>
  );
}
```

- [ ] **Step 4: Rodar o teste**

```bash
cd frontend && npx vitest run src/__tests__/LandingPage.test.jsx
```

Expected: PASS nos 3 testes (renderiza, headline, link /login)

- [ ] **Step 5: Commit**

```bash
git add frontend/src/components/landing/HeroSection.jsx frontend/src/components/landing/HeroSection.module.scss frontend/src/pages/LandingPage.jsx
git commit -m "feat: hero section da landing page"
```

---

## Task 5: Seção 2 — Dor

**Files:**
- Create: `frontend/src/components/landing/DorSection.jsx`
- Modify: `frontend/src/pages/LandingPage.jsx`

- [ ] **Step 1: Criar DorSection.jsx**

```jsx
// frontend/src/components/landing/DorSection.jsx
import { Link } from 'react-router-dom';
import styles from './DorSection.module.scss';
import shared from './landing.module.scss';

const MOMENTOS = [
  {
    emoji: '😰',
    titulo: 'Preceptor ocupado, caso que não fecha',
    descricao: 'A pressão do tempo real sem rede de apoio por perto.',
  },
  {
    emoji: '🌀',
    titulo: '4 abas abertas, 3 diagnósticos na cabeça',
    descricao: 'Informação demais, síntese de menos. O Google não sabe o contexto do seu paciente.',
  },
  {
    emoji: '🤔',
    titulo: '"Será que estou fazendo a coisa certa?"',
    descricao: 'A dúvida que ninguém fala em voz alta, mas todo mundo sente nos primeiros anos.',
  },
];

export default function DorSection() {
  return (
    <section className={styles.section}>
      <div className={shared.section}>
        <p className={shared.sectionLabel}>Você já passou por isso</p>

        <div className={styles.momentos}>
          {MOMENTOS.map((m) => (
            <div key={m.titulo} className={styles.momento}>
              <span className={styles.emoji}>{m.emoji}</span>
              <div>
                <strong className={styles.momentoTitulo}>{m.titulo}</strong>
                <p className={styles.momentoDesc}>{m.descricao}</p>
              </div>
            </div>
          ))}
        </div>

        <div className={styles.resolucao}>
          <strong>O Conduta foi feito para esse momento.</strong>
          <p>Análise clínica contextualizada, em segundos, sem julgamento.</p>
          <Link to="/login" className={shared.ctaButton} style={{ marginTop: '16px', display: 'inline-block' }}>
            Experimentar agora — grátis
          </Link>
        </div>
      </div>
    </section>
  );
}
```

- [ ] **Step 2: Criar DorSection.module.scss**

```scss
// frontend/src/components/landing/DorSection.module.scss
@use '../../styles/variables' as *;

.section {
  background: $color-surface;
  border-top: 1px solid $color-border;
  border-bottom: 1px solid $color-border;
}

.momentos {
  display: flex;
  flex-direction: column;
  gap: 24px;
  margin: 32px 0;
  max-width: 600px;
}

.momento {
  display: flex;
  gap: 20px;
  align-items: flex-start;
}

.emoji {
  font-size: 28px;
  flex-shrink: 0;
  line-height: 1;
  margin-top: 2px;
}

.momentoTitulo {
  font-size: 15px;
  font-weight: 700;
  color: $color-text-primary;
  display: block;
  margin-bottom: 4px;
}

.momentoDesc {
  font-size: 14px;
  color: $color-text-secondary;
  line-height: 1.6;
}

.resolucao {
  background: $color-bg;
  border-left: 4px solid $color-success;
  border-radius: 0 8px 8px 0;
  padding: 20px 24px;
  max-width: 560px;

  strong {
    font-size: 15px;
    color: $color-text-primary;
    display: block;
    margin-bottom: 6px;
  }

  p {
    font-size: 14px;
    color: $color-text-secondary;
    line-height: 1.6;
  }
}
```

- [ ] **Step 3: Adicionar ao LandingPage**

```jsx
// frontend/src/pages/LandingPage.jsx
import styles from './LandingPage.module.scss';
import Navbar from '../components/landing/Navbar';
import HeroSection from '../components/landing/HeroSection';
import DorSection from '../components/landing/DorSection';

export default function LandingPage() {
  return (
    <div className={styles.page}>
      <Navbar />
      <HeroSection />
      <DorSection />
    </div>
  );
}
```

- [ ] **Step 4: Commit**

```bash
git add frontend/src/components/landing/DorSection.jsx frontend/src/components/landing/DorSection.module.scss frontend/src/pages/LandingPage.jsx
git commit -m "feat: seção dor da landing page"
```

---

## Task 6: Seção 3 — Demo animada

**Files:**
- Create: `frontend/src/components/landing/DemoSection.jsx`
- Create: `frontend/src/components/landing/DemoSection.module.scss`
- Modify: `frontend/src/pages/LandingPage.jsx`

A animação usa `useEffect` + `useState` para revelar as mensagens em sequência: mensagem do usuário → indicador "analisando" → resposta estruturada.

- [ ] **Step 1: Criar DemoSection.jsx**

```jsx
// frontend/src/components/landing/DemoSection.jsx
import { useState, useEffect } from 'react';
import styles from './DemoSection.module.scss';
import shared from './landing.module.scss';

const FASE = { INICIAL: 0, USUARIO: 1, ANALISANDO: 2, RESPOSTA: 3 };

export default function DemoSection() {
  const [fase, setFase] = useState(FASE.INICIAL);

  useEffect(() => {
    const t1 = setTimeout(() => setFase(FASE.USUARIO), 600);
    const t2 = setTimeout(() => setFase(FASE.ANALISANDO), 1800);
    const t3 = setTimeout(() => setFase(FASE.RESPOSTA), 3200);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
  }, []);

  return (
    <section className={styles.section}>
      <div className={shared.section}>
        <div className={styles.header}>
          <p className={shared.sectionLabel}>Veja como funciona</p>
          <h2 className={shared.sectionTitle}>Descreva o caso.<br />Receba a análise.</h2>
          <p className={shared.sectionSubtitle}>
            Em linguagem natural, do jeito que você relataria para um colega.
          </p>
        </div>

        <div className={styles.chatWrap}>
          <div className={styles.chatBar}>
            <span className={styles.chatDot} />
            <span className={styles.chatBarTitle}>Conduta — Nova análise</span>
          </div>

          <div className={styles.chatBody}>
            {fase >= FASE.USUARIO && (
              <div className={`${styles.msgUser} ${styles.fadeIn}`}>
                Paciente feminina, 28 anos, G2P1, 34 semanas, refere cefaleia
                intensa há 2h, PA 160x110, edema +++ MMII, proteinúria 2+. Sem
                convulsões até o momento.
              </div>
            )}

            {fase === FASE.ANALISANDO && (
              <div className={`${styles.msgTyping} ${styles.fadeIn}`}>
                Analisando caso clínico...
              </div>
            )}

            {fase >= FASE.RESPOSTA && (
              <div className={`${styles.msgBot} ${styles.fadeIn}`}>
                <div className={styles.botLine}>
                  <span className={styles.success}>✓ HIPÓTESE PRINCIPAL</span>
                  <span className={styles.botValue}>Pré-eclâmpsia grave (iminência de eclâmpsia)</span>
                </div>
                <div className={styles.botLine}>
                  <span className={styles.warnLabel}>⚠ RED FLAGS ATIVOS</span>
                  <span className={styles.botValue}>
                    PA ≥ 160×110 + proteinúria + cefaleia = critérios de gravidade.
                    Risco de convulsão iminente.
                  </span>
                </div>
                <div className={styles.botLine}>
                  <span className={styles.mutedLabel}>→ CONDUTA IMEDIATA</span>
                  <span className={styles.botValue}>
                    1. Sulfato de magnésio (4g EV em 20 min)<br />
                    2. Anti-hipertensivo IV (Hidralazina ou Nifedipino)<br />
                    3. Acionar GO de plantão <strong>agora</strong><br />
                    4. Preparar para parto de urgência
                  </span>
                </div>
                <div className={styles.urgencia}>
                  🚨 NÃO aguardar evolução. Encaminhamento imediato.
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
```

- [ ] **Step 2: Criar DemoSection.module.scss**

```scss
// frontend/src/components/landing/DemoSection.module.scss
@use '../../styles/variables' as *;

.section {
  background: $color-bg;
}

.header {
  margin-bottom: 40px;
}

.chatWrap {
  background: $color-surface;
  border: 1px solid $color-border;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: $shadow-md;
  max-width: 640px;
}

.chatBar {
  background: $color-sidebar;
  padding: 12px 20px;
  display: flex;
  align-items: center;
  gap: 10px;
}

.chatDot {
  width: 8px;
  height: 8px;
  background: $color-accent;
  border-radius: 50%;
  flex-shrink: 0;
}

.chatBarTitle {
  font-size: 12px;
  color: $color-text-sidebar;
  font-weight: 600;
}

.chatBody {
  padding: 20px;
  min-height: 120px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.fadeIn {
  animation: fadeSlide 0.4s ease both;
}

@keyframes fadeSlide {
  from { opacity: 0; transform: translateY(8px); }
  to   { opacity: 1; transform: translateY(0); }
}

.msgUser {
  align-self: flex-end;
  background: $color-accent;
  color: white;
  border-radius: 12px 12px 2px 12px;
  padding: 12px 16px;
  font-size: 13px;
  line-height: 1.6;
  max-width: 90%;
}

.msgTyping {
  align-self: flex-start;
  background: $color-bg;
  border: 1px solid $color-border;
  border-radius: 12px 12px 12px 2px;
  padding: 10px 14px;
  font-size: 13px;
  color: $color-text-secondary;
  font-style: italic;
}

.msgBot {
  align-self: flex-start;
  background: $color-sidebar;
  border-radius: 12px 12px 12px 2px;
  padding: 16px;
  max-width: 95%;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.botLine {
  display: flex;
  flex-direction: column;
  gap: 3px;
}

.success   { font-size: 11px; font-weight: 700; color: $color-success; }
.warnLabel { font-size: 11px; font-weight: 700; color: $color-warning; }
.mutedLabel { font-size: 11px; font-weight: 700; color: $color-text-sidebar; }

.botValue {
  font-size: 12px;
  color: #d0dde4;
  line-height: 1.6;

  strong { color: white; }
}

.urgencia {
  background: rgba(192, 57, 43, 0.2);
  color: #e07060;
  font-size: 11px;
  font-weight: 600;
  border-radius: 6px;
  padding: 8px 12px;
  margin-top: 4px;
}
```

- [ ] **Step 3: Adicionar ao LandingPage**

```jsx
// frontend/src/pages/LandingPage.jsx
import styles from './LandingPage.module.scss';
import Navbar from '../components/landing/Navbar';
import HeroSection from '../components/landing/HeroSection';
import DorSection from '../components/landing/DorSection';
import DemoSection from '../components/landing/DemoSection';

export default function LandingPage() {
  return (
    <div className={styles.page}>
      <Navbar />
      <HeroSection />
      <DorSection />
      <DemoSection />
    </div>
  );
}
```

- [ ] **Step 4: Commit**

```bash
git add frontend/src/components/landing/DemoSection.jsx frontend/src/components/landing/DemoSection.module.scss frontend/src/pages/LandingPage.jsx
git commit -m "feat: seção demo animada da landing page"
```

---

## Task 7: Seção 4 — Features

**Files:**
- Create: `frontend/src/components/landing/FeaturesSection.jsx`
- Create: `frontend/src/components/landing/FeaturesSection.module.scss`
- Modify: `frontend/src/pages/LandingPage.jsx`

- [ ] **Step 1: Criar FeaturesSection.jsx**

```jsx
// frontend/src/components/landing/FeaturesSection.jsx
import styles from './FeaturesSection.module.scss';
import shared from './landing.module.scss';

const FEATURES = [
  {
    emoji: '🗣️',
    titulo: 'Fale como você pensa',
    descricao: 'Descreva o caso em português, do jeito que você relataria a um colega. Sem formulários, sem CID, sem estrutura forçada.',
    destaque: false,
  },
  {
    emoji: '📋',
    titulo: 'Baseado em protocolos nacionais',
    descricao: 'As sugestões de conduta seguem diretrizes do MS, PCDTs e sociedades médicas brasileiras — não IA genérica de internet.',
    destaque: false,
  },
  {
    emoji: '🚨',
    titulo: 'Red flags nunca passam despercebidos',
    descricao: 'O sistema identifica automaticamente sinais de alarme e critérios de encaminhamento — mesmo que você não tenha perguntado.',
    destaque: true,
  },
  {
    emoji: '🔁',
    titulo: 'Continue o raciocínio depois',
    descricao: 'Voltou o paciente em 48h? Pergunte de novo. O Conduta lembra do caso e ajusta a análise com base na evolução.',
    destaque: false,
  },
];

export default function FeaturesSection() {
  return (
    <section className={styles.section}>
      <div className={shared.section}>
        <p className={shared.sectionLabel}>Por que o Conduta funciona</p>
        <h2 className={shared.sectionTitle}>
          Não é o Google.<br />Não é o ChatGPT.<br />É clínico.
        </h2>

        <div className={styles.grid}>
          {FEATURES.map((f) => (
            <div
              key={f.titulo}
              className={`${styles.card} ${f.destaque ? styles.destaque : ''}`}
            >
              <span className={styles.emoji}>{f.emoji}</span>
              <strong className={styles.cardTitulo}>{f.titulo}</strong>
              <p className={styles.cardDesc}>{f.descricao}</p>
            </div>
          ))}
        </div>

        <div className={styles.privacidade}>
          <span className={styles.privIcon}>🔒</span>
          <div>
            <strong>Seus dados são seus</strong>
            <p>
              Nenhuma informação de paciente é armazenada com identificação. Você
              analisa casos — o Conduta não arquiva prontuários.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
```

- [ ] **Step 2: Criar FeaturesSection.module.scss**

```scss
// frontend/src/components/landing/FeaturesSection.module.scss
@use '../../styles/variables' as *;

.section {
  background: $color-surface;
  border-top: 1px solid $color-border;
}

.grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
  margin-top: 40px;
  margin-bottom: 24px;

  @media (max-width: 640px) {
    grid-template-columns: 1fr;
  }
}

.card {
  background: $color-bg;
  border-radius: 10px;
  padding: 24px;
  border-top: 3px solid $color-accent;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.destaque {
  border-top-color: $color-warning;
}

.emoji {
  font-size: 28px;
  line-height: 1;
}

.cardTitulo {
  font-size: 15px;
  font-weight: 700;
  color: $color-text-primary;
}

.cardDesc {
  font-size: 13px;
  color: $color-text-secondary;
  line-height: 1.6;
}

.privacidade {
  background: $color-sidebar;
  border-radius: 10px;
  padding: 20px 24px;
  display: flex;
  align-items: flex-start;
  gap: 16px;
  margin-top: 8px;

  strong {
    font-size: 14px;
    font-weight: 700;
    color: white;
    display: block;
    margin-bottom: 4px;
  }

  p {
    font-size: 13px;
    color: $color-text-sidebar;
    line-height: 1.6;
  }
}

.privIcon {
  font-size: 24px;
  flex-shrink: 0;
  margin-top: 2px;
}
```

- [ ] **Step 3: Adicionar ao LandingPage**

```jsx
// frontend/src/pages/LandingPage.jsx
import styles from './LandingPage.module.scss';
import Navbar from '../components/landing/Navbar';
import HeroSection from '../components/landing/HeroSection';
import DorSection from '../components/landing/DorSection';
import DemoSection from '../components/landing/DemoSection';
import FeaturesSection from '../components/landing/FeaturesSection';

export default function LandingPage() {
  return (
    <div className={styles.page}>
      <Navbar />
      <HeroSection />
      <DorSection />
      <DemoSection />
      <FeaturesSection />
    </div>
  );
}
```

- [ ] **Step 4: Commit**

```bash
git add frontend/src/components/landing/FeaturesSection.jsx frontend/src/components/landing/FeaturesSection.module.scss frontend/src/pages/LandingPage.jsx
git commit -m "feat: seção features da landing page"
```

---

## Task 8: Seção 5 — Prova Social

**Files:**
- Create: `frontend/src/components/landing/ProvaSection.jsx`
- Create: `frontend/src/components/landing/ProvaSection.module.scss`
- Modify: `frontend/src/pages/LandingPage.jsx`

> **Ação necessária antes de implementar:** substituir o placeholder do quote pelo depoimento real do beta tester.

- [ ] **Step 1: Criar ProvaSection.jsx**

```jsx
// frontend/src/components/landing/ProvaSection.jsx
import styles from './ProvaSection.module.scss';
import shared from './landing.module.scss';

// TODO: substituir pelo depoimento real antes do deploy
const QUOTE = {
  texto:
    'Exatamente o que eu precisava no internato — alguém pra confirmar que minha hipótese fazia sentido antes de apresentar pro preceptor.',
  autor: 'Médica residente · São Paulo',
};

const CREDENCIAIS = [
  { sigla: 'PCDTs', desc: 'Protocolos Clínicos e Diretrizes Terapêuticas MS' },
  { sigla: 'CFM',   desc: 'Condutas alinhadas às resoluções do conselho' },
  { sigla: 'SUS',   desc: 'Foco em atenção primária e pronto atendimento' },
  { sigla: 'BR',    desc: '100% em português, contexto brasileiro' },
];

export default function ProvaSection() {
  return (
    <section className={styles.section}>
      <div className={shared.section}>
        <p className={shared.sectionLabel}>Feito por quem entende</p>
        <h2 className={shared.sectionTitle}>Para quem está começando.</h2>

        <blockquote className={styles.quote}>
          <p>"{QUOTE.texto}"</p>
          <footer>— {QUOTE.autor}</footer>
        </blockquote>

        <div className={styles.credGrid}>
          {CREDENCIAIS.map((c) => (
            <div key={c.sigla} className={styles.cred}>
              <strong className={styles.credSigla}>{c.sigla}</strong>
              <span className={styles.credDesc}>{c.desc}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
```

- [ ] **Step 2: Criar ProvaSection.module.scss**

```scss
// frontend/src/components/landing/ProvaSection.module.scss
@use '../../styles/variables' as *;

.section {
  background: $color-bg;
  border-top: 1px solid $color-border;
}

.quote {
  background: $color-surface;
  border: 1px solid $color-border;
  border-radius: 10px;
  padding: 28px 32px;
  margin: 36px 0;
  max-width: 600px;

  p {
    font-size: 16px;
    color: $color-text-secondary;
    font-style: italic;
    line-height: 1.7;
    margin-bottom: 16px;
  }

  footer {
    font-size: 13px;
    color: $color-accent;
    font-weight: 600;
    font-style: normal;
  }
}

.credGrid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 12px;
  max-width: 600px;

  @media (max-width: 640px) {
    grid-template-columns: 1fr 1fr;
  }
}

.cred {
  background: $color-surface;
  border: 1px solid $color-border;
  border-radius: 8px;
  padding: 16px 12px;
  text-align: center;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.credSigla {
  font-size: 18px;
  font-weight: 800;
  color: $color-accent;
}

.credDesc {
  font-size: 11px;
  color: $color-text-secondary;
  line-height: 1.4;
}
```

- [ ] **Step 3: Adicionar ao LandingPage**

```jsx
// frontend/src/pages/LandingPage.jsx
import styles from './LandingPage.module.scss';
import Navbar from '../components/landing/Navbar';
import HeroSection from '../components/landing/HeroSection';
import DorSection from '../components/landing/DorSection';
import DemoSection from '../components/landing/DemoSection';
import FeaturesSection from '../components/landing/FeaturesSection';
import ProvaSection from '../components/landing/ProvaSection';

export default function LandingPage() {
  return (
    <div className={styles.page}>
      <Navbar />
      <HeroSection />
      <DorSection />
      <DemoSection />
      <FeaturesSection />
      <ProvaSection />
    </div>
  );
}
```

- [ ] **Step 4: Commit**

```bash
git add frontend/src/components/landing/ProvaSection.jsx frontend/src/components/landing/ProvaSection.module.scss frontend/src/pages/LandingPage.jsx
git commit -m "feat: seção prova social da landing page"
```

---

## Task 9: Seção 6 — Preços

**Files:**
- Create: `frontend/src/components/landing/PrecosSection.jsx`
- Create: `frontend/src/components/landing/PrecosSection.module.scss`
- Modify: `frontend/src/pages/LandingPage.jsx`
- Test: `frontend/src/__tests__/LandingPage.test.jsx`

- [ ] **Step 1: Adicionar teste de preços**

```jsx
// Adicionar ao describe existente em LandingPage.test.jsx
it('exibe os dois planos de preço', () => {
  renderLanding();
  expect(screen.getByText(/gratuito/i)).toBeInTheDocument();
  expect(screen.getByText(/R\$39,90/)).toBeInTheDocument();
});
```

- [ ] **Step 2: Criar PrecosSection.jsx**

```jsx
// frontend/src/components/landing/PrecosSection.jsx
import { Link } from 'react-router-dom';
import styles from './PrecosSection.module.scss';
import shared from './landing.module.scss';

const PLANO_FREE = {
  nome: 'Gratuito',
  preco: 'R$0',
  periodo: 'para sempre',
  cta: 'Começar grátis',
  itens: [
    { texto: '15 análises por mês', ativo: true },
    { texto: 'Diagnóstico diferencial completo', ativo: true },
    { texto: 'Red flags automáticos', ativo: true },
    { texto: 'Conduta baseada em protocolos', ativo: true },
    { texto: 'Sem cartão de crédito', ativo: true },
    { texto: 'Histórico de casos', ativo: false },
    { texto: 'Análises ilimitadas', ativo: false },
  ],
};

const PLANO_PRO = {
  nome: 'Pro',
  preco: 'R$39,90',
  periodo: '/mês',
  cta: 'Assinar Pro',
  itens: [
    { texto: 'Análises ilimitadas', ativo: true, destaque: true },
    { texto: 'Diagnóstico diferencial completo', ativo: true },
    { texto: 'Red flags automáticos', ativo: true },
    { texto: 'Conduta baseada em protocolos', ativo: true },
    { texto: 'Histórico completo de casos', ativo: true, destaque: true },
    { texto: 'Suporte prioritário', ativo: true, destaque: true },
    { texto: 'Acesso a novos recursos primeiro', ativo: true },
  ],
};

function ItemPlano({ item }) {
  if (!item.ativo) {
    return (
      <li className={styles.itemInativo}>
        <span className={styles.dash}>—</span> {item.texto}
      </li>
    );
  }
  return (
    <li className={`${styles.item} ${item.destaque ? styles.itemDestaque : ''}`}>
      <span className={styles.check}>✓</span> {item.texto}
    </li>
  );
}

export default function PrecosSection() {
  return (
    <section className={styles.section}>
      <div className={shared.section}>
        <p className={shared.sectionLabel}>Planos</p>
        <h2 className={shared.sectionTitle}>
          Comece grátis.<br />Evolua quando precisar.
        </h2>

        <div className={styles.grid}>
          {/* Plano Free */}
          <div className={styles.plano}>
            <div className={styles.planoNome}>{PLANO_FREE.nome}</div>
            <div className={styles.planoPreco}>
              {PLANO_FREE.preco}
              <span className={styles.planoPeriodo}> {PLANO_FREE.periodo}</span>
            </div>
            <Link to="/login" className={`${styles.planoCta} ${styles.planoCtaDark}`}>
              {PLANO_FREE.cta}
            </Link>
            <ul className={styles.lista}>
              {PLANO_FREE.itens.map((i) => <ItemPlano key={i.texto} item={i} />)}
            </ul>
          </div>

          {/* Plano Pro */}
          <div className={`${styles.plano} ${styles.planoDestaque}`}>
            <div className={styles.badge}>Mais popular</div>
            <div className={styles.planoNomePro}>{PLANO_PRO.nome}</div>
            <div className={styles.planoPrecoPro}>
              {PLANO_PRO.preco}
              <span className={styles.planoPeriodoPro}>{PLANO_PRO.periodo}</span>
            </div>
            <Link to="/login" className={`${styles.planoCta} ${styles.planoCtaPro}`}>
              {PLANO_PRO.cta}
            </Link>
            <ul className={styles.lista}>
              {PLANO_PRO.itens.map((i) => <ItemPlano key={i.texto} item={i} />)}
            </ul>
          </div>
        </div>

        <p className={styles.estudante}>
          Estudante de medicina?{' '}
          <a href="mailto:contato@useconduta.com.br" className={styles.estudanteLink}>
            Fale com a gente — temos condições especiais.
          </a>
        </p>
      </div>
    </section>
  );
}
```

- [ ] **Step 3: Criar PrecosSection.module.scss**

```scss
// frontend/src/components/landing/PrecosSection.module.scss
@use '../../styles/variables' as *;

.section {
  background: $color-bg;
  border-top: 1px solid $color-border;
}

.grid {
  display: flex;
  gap: 20px;
  margin-top: 40px;
  max-width: 640px;
  align-items: flex-start;

  @media (max-width: 640px) {
    flex-direction: column;
  }
}

.plano {
  flex: 1;
  background: $color-surface;
  border: 1px solid $color-border;
  border-radius: 12px;
  padding: 28px 24px;
  position: relative;
}

.planoDestaque {
  border: 2px solid $color-accent;
  background: $color-sidebar;
}

.badge {
  position: absolute;
  top: -13px;
  left: 50%;
  transform: translateX(-50%);
  background: $color-accent;
  color: white;
  font-size: 10px;
  font-weight: 700;
  padding: 4px 14px;
  border-radius: 20px;
  white-space: nowrap;
  letter-spacing: 1px;
  text-transform: uppercase;
}

.planoNome {
  font-size: 12px;
  font-weight: 700;
  color: $color-text-secondary;
  text-transform: uppercase;
  letter-spacing: 1px;
  margin-bottom: 8px;
}

.planoNomePro {
  @extend .planoNome;
  color: $color-text-sidebar;
}

.planoPreco {
  font-size: 36px;
  font-weight: 800;
  color: $color-text-primary;
  margin-bottom: 4px;
}

.planoPrecoPro {
  @extend .planoPreco;
  color: white;
}

.planoPeriodo {
  font-size: 14px;
  font-weight: 400;
  color: $color-text-secondary;
}

.planoPeriodoPro {
  @extend .planoPeriodo;
  color: $color-text-sidebar;
}

.planoCta {
  display: block;
  text-align: center;
  padding: 12px;
  border-radius: $border-radius;
  font-size: 14px;
  font-weight: 700;
  text-decoration: none;
  margin: 20px 0;
  transition: opacity 0.15s;

  &:hover { opacity: 0.88; }
}

.planoCtaDark {
  background: $color-sidebar;
  color: white;
}

.planoCtaPro {
  background: $color-accent;
  color: white;
}

.lista {
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.item {
  font-size: 13px;
  color: $color-text-secondary;
  display: flex;
  align-items: flex-start;
  gap: 8px;
}

.itemDestaque {
  color: $color-text-primary;
  font-weight: 600;

  .check { color: $color-success; }
}

.itemInativo {
  font-size: 13px;
  color: #c0c0c0;
  display: flex;
  gap: 8px;
}

.check { color: $color-success; font-weight: 700; flex-shrink: 0; }
.dash  { color: #c0c0c0; flex-shrink: 0; }

.estudante {
  font-size: 13px;
  color: $color-text-secondary;
  margin-top: 24px;
}

.estudanteLink {
  color: $color-accent;
  font-weight: 600;
  text-decoration: none;

  &:hover { text-decoration: underline; }
}
```

- [ ] **Step 4: Adicionar ao LandingPage**

```jsx
// frontend/src/pages/LandingPage.jsx
import styles from './LandingPage.module.scss';
import Navbar from '../components/landing/Navbar';
import HeroSection from '../components/landing/HeroSection';
import DorSection from '../components/landing/DorSection';
import DemoSection from '../components/landing/DemoSection';
import FeaturesSection from '../components/landing/FeaturesSection';
import ProvaSection from '../components/landing/ProvaSection';
import PrecosSection from '../components/landing/PrecosSection';

export default function LandingPage() {
  return (
    <div className={styles.page}>
      <Navbar />
      <HeroSection />
      <DorSection />
      <DemoSection />
      <FeaturesSection />
      <ProvaSection />
      <PrecosSection />
    </div>
  );
}
```

- [ ] **Step 5: Rodar testes**

```bash
cd frontend && npx vitest run src/__tests__/LandingPage.test.jsx
```

Expected: PASS em todos os testes incluindo o novo de preços.

- [ ] **Step 6: Commit**

```bash
git add frontend/src/components/landing/PrecosSection.jsx frontend/src/components/landing/PrecosSection.module.scss frontend/src/pages/LandingPage.jsx frontend/src/__tests__/LandingPage.test.jsx
git commit -m "feat: seção preços da landing page"
```

---

## Task 10: Seção 7 — FAQ

**Files:**
- Create: `frontend/src/components/landing/FaqSection.jsx`
- Create: `frontend/src/components/landing/FaqSection.module.scss`
- Modify: `frontend/src/pages/LandingPage.jsx`
- Test: `frontend/src/__tests__/LandingPage.test.jsx`

- [ ] **Step 1: Adicionar teste de FAQ**

```jsx
// Adicionar ao describe existente em LandingPage.test.jsx
import userEvent from '@testing-library/user-event';

it('FAQ — abre resposta ao clicar na pergunta', async () => {
  renderLanding();
  const pergunta = screen.getByText(/substitui o médico/i);
  expect(screen.queryByText(/ferramenta de apoio à decisão/i)).not.toBeInTheDocument();
  await userEvent.click(pergunta);
  expect(screen.getByText(/ferramenta de apoio à decisão/i)).toBeInTheDocument();
});
```

- [ ] **Step 2: Rodar e verificar falha**

```bash
cd frontend && npx vitest run src/__tests__/LandingPage.test.jsx
```

Expected: FAIL — `queryByText` retorna null porque FaqSection não existe ainda.

- [ ] **Step 3: Criar FaqSection.jsx**

```jsx
// frontend/src/components/landing/FaqSection.jsx
import { useState } from 'react';
import styles from './FaqSection.module.scss';
import shared from './landing.module.scss';

const PERGUNTAS = [
  {
    q: 'O Conduta substitui o médico ou o preceptor?',
    a: 'Não. O Conduta é uma ferramenta de apoio à decisão clínica — como um segundo par de olhos. A responsabilidade e o julgamento final são sempre do médico. Use como confirmação, não como substituição.',
  },
  {
    q: 'Os dados do meu paciente ficam salvos em algum lugar?',
    a: 'Não armazenamos dados identificáveis de pacientes. As análises são processadas e descartadas — você mantém o controle. Não insira nome, CPF ou dados que identifiquem o paciente.',
  },
  {
    q: 'Funciona para estudante de medicina também?',
    a: 'Sim — e é especialmente útil no internato e na residência. Se você é estudante e quer acesso, entre em contato pelo chat: temos condições especiais para quem está em formação.',
  },
  {
    q: 'As condutas são baseadas em quê?',
    a: 'Em protocolos clínicos e diretrizes terapêuticas brasileiras (PCDTs do Ministério da Saúde), guidelines de sociedades médicas nacionais e literatura clínica. O foco é atenção primária e pronto atendimento no contexto do SUS.',
  },
  {
    q: 'O plano grátis tem limite de tempo?',
    a: 'Não. As 15 análises são por mês, renovam todo mês, para sempre. Você não perde o acesso — só faz upgrade se quiser usar mais.',
  },
];

function FaqItem({ pergunta }) {
  const [aberto, setAberto] = useState(false);

  return (
    <div className={`${styles.item} ${aberto ? styles.aberto : ''}`}>
      <button
        className={styles.pergunta}
        onClick={() => setAberto((v) => !v)}
        aria-expanded={aberto}
      >
        {pergunta.q}
        <span className={styles.icon}>{aberto ? '−' : '+'}</span>
      </button>
      {aberto && <p className={styles.resposta}>{pergunta.a}</p>}
    </div>
  );
}

export default function FaqSection() {
  return (
    <section className={styles.section}>
      <div className={shared.section}>
        <p className={shared.sectionLabel}>Dúvidas frequentes</p>
        <h2 className={shared.sectionTitle}>Antes de começar</h2>

        <div className={styles.lista}>
          {PERGUNTAS.map((p) => (
            <FaqItem key={p.q} pergunta={p} />
          ))}
        </div>
      </div>
    </section>
  );
}
```

- [ ] **Step 4: Criar FaqSection.module.scss**

```scss
// frontend/src/components/landing/FaqSection.module.scss
@use '../../styles/variables' as *;

.section {
  background: $color-surface;
  border-top: 1px solid $color-border;
}

.lista {
  margin-top: 32px;
  display: flex;
  flex-direction: column;
  gap: 0;
  max-width: 680px;
  border: 1px solid $color-border;
  border-radius: 10px;
  overflow: hidden;
}

.item {
  border-bottom: 1px solid $color-border;

  &:last-child { border-bottom: none; }
}

.aberto .pergunta {
  color: $color-accent;
}

.pergunta {
  width: 100%;
  text-align: left;
  padding: 18px 20px;
  font-size: 14px;
  font-weight: 600;
  color: $color-text-primary;
  background: none;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 16px;
  cursor: pointer;
  transition: color 0.15s;

  &:hover { color: $color-accent; }
}

.icon {
  font-size: 18px;
  font-weight: 300;
  flex-shrink: 0;
  color: $color-text-secondary;
}

.resposta {
  padding: 0 20px 18px;
  font-size: 13px;
  color: $color-text-secondary;
  line-height: 1.7;
}
```

- [ ] **Step 5: Adicionar ao LandingPage**

```jsx
// frontend/src/pages/LandingPage.jsx
import styles from './LandingPage.module.scss';
import Navbar from '../components/landing/Navbar';
import HeroSection from '../components/landing/HeroSection';
import DorSection from '../components/landing/DorSection';
import DemoSection from '../components/landing/DemoSection';
import FeaturesSection from '../components/landing/FeaturesSection';
import ProvaSection from '../components/landing/ProvaSection';
import PrecosSection from '../components/landing/PrecosSection';
import FaqSection from '../components/landing/FaqSection';

export default function LandingPage() {
  return (
    <div className={styles.page}>
      <Navbar />
      <HeroSection />
      <DorSection />
      <DemoSection />
      <FeaturesSection />
      <ProvaSection />
      <PrecosSection />
      <FaqSection />
    </div>
  );
}
```

- [ ] **Step 6: Rodar testes**

```bash
cd frontend && npx vitest run src/__tests__/LandingPage.test.jsx
```

Expected: PASS em todos.

- [ ] **Step 7: Commit**

```bash
git add frontend/src/components/landing/FaqSection.jsx frontend/src/components/landing/FaqSection.module.scss frontend/src/pages/LandingPage.jsx frontend/src/__tests__/LandingPage.test.jsx
git commit -m "feat: seção FAQ com accordion da landing page"
```

---

## Task 11: Seção 8 — CTA Final + Footer

**Files:**
- Create: `frontend/src/components/landing/CtaFinalSection.jsx`
- Create: `frontend/src/components/landing/CtaFinalSection.module.scss`
- Modify: `frontend/src/pages/LandingPage.jsx`

- [ ] **Step 1: Criar CtaFinalSection.jsx**

```jsx
// frontend/src/components/landing/CtaFinalSection.jsx
import { Link } from 'react-router-dom';
import styles from './CtaFinalSection.module.scss';

export default function CtaFinalSection() {
  return (
    <section className={styles.section}>
      <div className={styles.inner}>
        <p className={styles.label}>Pronto para começar?</p>

        <h2 className={styles.headline}>
          A próxima dúvida clínica<br />
          <span className={styles.accent}>não precisa ser solitária.</span>
        </h2>

        <p className={styles.sub}>
          15 análises por mês, grátis, sem cartão.<br />
          Comece agora e sinta a diferença na primeira consulta.
        </p>

        <div className={styles.ctaGroup}>
          <Link to="/login" className={styles.ctaBtn}>Criar conta grátis</Link>
          <span className={styles.ou}>
            ou <Link to="/login" className={styles.verPlanos}>ver planos</Link>
          </span>
        </div>

        <div className={styles.microcopy}>
          <span>✓ Sem cartão de crédito</span>
          <span>✓ Cancele quando quiser</span>
          <span>✓ Acesso imediato</span>
        </div>
      </div>

      <footer className={styles.footer}>
        <span>Conduta · Feito para médicos brasileiros</span>
        <a href="mailto:contato@useconduta.com.br" className={styles.footerLink}>
          contato@useconduta.com.br
        </a>
      </footer>
    </section>
  );
}
```

- [ ] **Step 2: Criar CtaFinalSection.module.scss**

```scss
// frontend/src/components/landing/CtaFinalSection.module.scss
@use '../../styles/variables' as *;

.section {
  background: $color-sidebar;
  padding: 80px 24px 0;
  text-align: center;
}

.inner {
  max-width: 600px;
  margin: 0 auto;
  padding-bottom: 72px;
}

.label {
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 2px;
  text-transform: uppercase;
  color: $color-text-sidebar;
  margin-bottom: 20px;
}

.headline {
  font-size: 36px;
  font-weight: 800;
  color: white;
  line-height: 1.25;
  margin-bottom: 16px;

  @media (max-width: 640px) {
    font-size: 26px;
  }
}

.accent {
  color: $color-accent;
}

.sub {
  font-size: 16px;
  color: $color-text-sidebar;
  line-height: 1.6;
  margin-bottom: 36px;
}

.ctaGroup {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 16px;
  margin-bottom: 20px;

  @media (max-width: 480px) {
    flex-direction: column;
    gap: 10px;
  }
}

.ctaBtn {
  background: $color-accent;
  color: white;
  padding: 14px 36px;
  border-radius: $border-radius;
  font-weight: 800;
  font-size: 15px;
  text-decoration: none;
  transition: background 0.15s;

  &:hover { background: $color-accent-hover; }
}

.ou {
  font-size: 13px;
  color: $color-text-sidebar;
}

.verPlanos {
  color: white;
  text-decoration: underline;
  font-weight: 500;

  &:hover { color: $color-text-sidebar; }
}

.microcopy {
  display: flex;
  justify-content: center;
  gap: 24px;
  font-size: 12px;
  color: $color-text-sidebar;
  flex-wrap: wrap;
}

.footer {
  border-top: 1px solid rgba(255, 255, 255, 0.08);
  padding: 20px 24px;
  display: flex;
  justify-content: center;
  gap: 24px;
  font-size: 12px;
  color: rgba(176, 196, 204, 0.5);
  flex-wrap: wrap;
}

.footerLink {
  color: inherit;
  text-decoration: none;

  &:hover { color: $color-text-sidebar; }
}
```

- [ ] **Step 3: LandingPage.jsx final completa**

```jsx
// frontend/src/pages/LandingPage.jsx
import styles from './LandingPage.module.scss';
import Navbar from '../components/landing/Navbar';
import HeroSection from '../components/landing/HeroSection';
import DorSection from '../components/landing/DorSection';
import DemoSection from '../components/landing/DemoSection';
import FeaturesSection from '../components/landing/FeaturesSection';
import ProvaSection from '../components/landing/ProvaSection';
import PrecosSection from '../components/landing/PrecosSection';
import FaqSection from '../components/landing/FaqSection';
import CtaFinalSection from '../components/landing/CtaFinalSection';

export default function LandingPage() {
  return (
    <div className={styles.page}>
      <Navbar />
      <HeroSection />
      <DorSection />
      <DemoSection />
      <FeaturesSection />
      <ProvaSection />
      <PrecosSection />
      <FaqSection />
      <CtaFinalSection />
    </div>
  );
}
```

- [ ] **Step 4: Rodar todos os testes**

```bash
cd frontend && npx vitest run
```

Expected: PASS em todos.

- [ ] **Step 5: Commit final**

```bash
git add frontend/src/components/landing/CtaFinalSection.jsx frontend/src/components/landing/CtaFinalSection.module.scss frontend/src/pages/LandingPage.jsx
git commit -m "feat: CTA final e footer da landing page — estrutura completa"
```

---

## Task 12: Smoke test visual + ajustes mobile

**Files:**
- No new files

- [ ] **Step 1: Iniciar o dev server**

```bash
cd frontend && npm run dev
```

Abrir `http://localhost:5173` no browser.

- [ ] **Step 2: Checklist visual desktop (1280px)**

Verificar cada seção:
- [ ] Navbar fixa no topo com scroll
- [ ] Hero: headline, badge, preview do chat visíveis
- [ ] Seção Dor: 3 momentos com emoji alinhados
- [ ] Demo: animação dispara, chat aparece em sequência
- [ ] Features: grade 2×2, faixa de privacidade ao fundo
- [ ] Prova Social: quote + 4 credenciais em grid
- [ ] Preços: 2 cards, badge "Mais popular" no Pro, itens inativos acinzentados
- [ ] FAQ: clicar em cada pergunta abre/fecha corretamente
- [ ] CTA Final: fundo navy, destaque teal no accent

- [ ] **Step 3: Checklist visual mobile (390px — iPhone)**

Abrir DevTools → toggle device toolbar → iPhone 14.

- [ ] Navbar: brand e botão visíveis sem overflow
- [ ] Hero: headline quebra bem em 3 linhas, preview legível
- [ ] Grid features muda para 1 coluna
- [ ] Preços: cards empilham verticalmente
- [ ] FAQ: perguntas não truncam

- [ ] **Step 4: Corrigir qualquer problema encontrado**

Editar o SCSS correspondente à seção com problema.

- [ ] **Step 5: Commit final**

```bash
git add -p  # adicionar apenas o que foi corrigido
git commit -m "fix: ajustes responsivos da landing page"
```

---

## Notas

- **Quote da ProvaSection:** substituir o texto placeholder pelo depoimento real do beta tester antes de publicar (`ProvaSection.jsx` linha com `const QUOTE`).
- **Email de contato:** substituir `contato@useconduta.com.br` pelo email real em `PrecosSection.jsx` e `CtaFinalSection.jsx`.
- **Registro de usuário:** os CTAs apontam para `/login`. Se quiser uma rota `/cadastro` separada no futuro, basta trocar o `to="/login"` nos componentes de landing.

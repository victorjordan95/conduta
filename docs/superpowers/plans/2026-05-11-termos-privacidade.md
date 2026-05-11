# Termos de Uso, Política de Privacidade & Disclaimers Clínicos — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Adicionar Termos de Uso, Política de Privacidade (LGPD), checkbox de aceite no cadastro e disclaimers clínicos na UI do Conduta antes do lançamento para usuários reais.

**Architecture:** Migração SQL adiciona `terms_accepted_at` à tabela `users`; backend salva o timestamp no `/auth/signup`; frontend ganha duas páginas estáticas (`/termos`, `/privacidade`), um banner de aviso no Dashboard, um disclaimer no rodapé de cada resposta da IA, e links no footer.

**Tech Stack:** Node.js/Express (backend), PostgreSQL (migração), React 18 + Vite + SCSS Modules (frontend), Vitest + Testing Library (testes frontend), Jest + Supertest (testes backend).

---

## Arquivo Map

| Ação | Arquivo |
|------|---------|
| Criar | `conduta/backend/src/db/migrations/012_terms_accepted_at.sql` |
| Modificar | `conduta/backend/src/routes/auth.js` |
| Modificar | `conduta/backend/src/__tests__/auth.test.js` |
| Criar | `conduta/frontend/src/pages/TermosUso.jsx` |
| Criar | `conduta/frontend/src/pages/PoliticaPrivacidade.jsx` |
| Criar | `conduta/frontend/src/pages/LegalPage.module.scss` |
| Modificar | `conduta/frontend/src/App.jsx` |
| Modificar | `conduta/frontend/src/services/api.js` |
| Modificar | `conduta/frontend/src/pages/Register.jsx` |
| Modificar | `conduta/frontend/src/pages/Register.module.scss` |
| Criar | `conduta/frontend/src/__tests__/Register.test.jsx` |
| Modificar | `conduta/frontend/src/pages/Dashboard.jsx` |
| Modificar | `conduta/frontend/src/pages/Dashboard.module.scss` |
| Modificar | `conduta/frontend/src/components/AnalysisResult.jsx` |
| Modificar | `conduta/frontend/src/components/AnalysisResult.module.scss` |

---

## Task 1: Migração SQL — `terms_accepted_at`

**Files:**
- Create: `conduta/backend/src/db/migrations/012_terms_accepted_at.sql`

- [ ] **Step 1: Criar o arquivo de migração**

```sql
ALTER TABLE users ADD COLUMN IF NOT EXISTS terms_accepted_at TIMESTAMPTZ;
```

- [ ] **Step 2: Executar a migração**

```bash
cd conduta/backend
node src/db/migrate.js
```

Saída esperada: `Migration executada: 012_terms_accepted_at.sql`

- [ ] **Step 3: Verificar a coluna no banco**

```bash
psql $DATABASE_URL -c "\d users" | grep terms
```

Saída esperada: `terms_accepted_at | timestamp with time zone`

- [ ] **Step 4: Commit**

```bash
git add conduta/backend/src/db/migrations/012_terms_accepted_at.sql
git commit -m "feat(db): adiciona terms_accepted_at em users"
```

---

## Task 2: Backend — salvar `terms_accepted_at` no signup

**Files:**
- Modify: `conduta/backend/src/routes/auth.js` (rota `POST /auth/signup`, linha ~111)

- [ ] **Step 1: Escrever o teste que falha** (ver Task 3 — complete Task 3 step 1 antes de implementar)

- [ ] **Step 2: Atualizar a rota `/auth/signup`**

Substituir o bloco da rota `POST /auth/signup` inteiro:

```js
router.post('/signup', async (req, res) => {
  const { email, nome, senha, terms_accepted_at } = req.body;
  const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;

  if (!email || !nome || !senha) {
    return res.status(400).json({ error: 'Nome, email e senha são obrigatórios.' });
  }

  if (senha.length < 8) {
    return res.status(400).json({ error: 'Senha deve ter ao menos 8 caracteres.' });
  }

  try {
    const senhaHash = await bcrypt.hash(senha, 10);
    const result = await pool.query(
      `INSERT INTO users (email, nome, senha_hash, role, terms_accepted_at)
       VALUES ($1, $2, $3, 'user', $4)
       RETURNING id, email, nome, role, plan, coachmarks_welcome_seen, coachmarks_session_seen`,
      [email, nome, senhaHash, terms_accepted_at || null]
    );
    const user = result.rows[0];

    const svResult = await pool.query(
      'UPDATE users SET session_version = session_version + 1 WHERE id = $1 RETURNING session_version',
      [user.id]
    );
    const sv = svResult.rows[0].session_version;

    const token = jwt.sign(
      { sub: user.id, role: user.role, sv },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '8h' }
    );

    console.log(`[AUTH] SIGNUP success | userId=${user.id} email=${email} ip=${ip}`);
    res.status(201).json({ token, user });
  } catch (err) {
    if (err.code === '23505') {
      return res.status(409).json({ error: 'Email já cadastrado.' });
    }
    console.error(`[AUTH] SIGNUP error | email=${email} | ${err.message}`);
    res.status(500).json({ error: 'Erro interno.' });
  }
});
```

---

## Task 3: Teste backend — signup salva `terms_accepted_at`

**Files:**
- Modify: `conduta/backend/src/__tests__/auth.test.js`

- [ ] **Step 1: Adicionar `describe` de signup no final do arquivo**

Adicionar ao final de `auth.test.js`:

```js
describe('POST /auth/signup', () => {
  const email = 'signup-test@conduta.dev';

  afterAll(async () => {
    await pool.query('DELETE FROM users WHERE email = $1', [email]);
  });

  it('cria usuário e salva terms_accepted_at quando enviado', async () => {
    const termsTs = new Date().toISOString();

    const res = await request(app)
      .post('/auth/signup')
      .send({ nome: 'Dr. Signup', email, senha: 'Senha123', terms_accepted_at: termsTs });

    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty('token');
    expect(res.body.user).toHaveProperty('email', email);

    const db = await pool.query(
      'SELECT terms_accepted_at FROM users WHERE email = $1',
      [email]
    );
    expect(db.rows[0].terms_accepted_at).not.toBeNull();
  });

  it('cria usuário com terms_accepted_at null quando não enviado', async () => {
    const email2 = 'signup-noterms@conduta.dev';
    try {
      const res = await request(app)
        .post('/auth/signup')
        .send({ nome: 'Dr. NoTerms', email: email2, senha: 'Senha123' });

      expect(res.status).toBe(201);

      const db = await pool.query(
        'SELECT terms_accepted_at FROM users WHERE email = $1',
        [email2]
      );
      expect(db.rows[0].terms_accepted_at).toBeNull();
    } finally {
      await pool.query('DELETE FROM users WHERE email = $1', [email2]);
    }
  });
});
```

- [ ] **Step 2: Rodar os testes para verificar que falham antes da implementação**

```bash
cd conduta/backend
npx jest --testPathPattern=auth.test --no-coverage
```

Esperado: `FAIL` nos dois novos testes (coluna ou INSERT não existem ainda).

- [ ] **Step 3: Implementar o backend (Task 2 Step 2) e rodar de novo**

```bash
npx jest --testPathPattern=auth.test --no-coverage
```

Esperado: `PASS` em todos os testes de auth.

- [ ] **Step 4: Commit**

```bash
git add conduta/backend/src/routes/auth.js conduta/backend/src/__tests__/auth.test.js
git commit -m "feat(auth): salva terms_accepted_at no signup"
```

---

## Task 4: Frontend — páginas estáticas `/termos` e `/privacidade`

**Files:**
- Create: `conduta/frontend/src/pages/LegalPage.module.scss`
- Create: `conduta/frontend/src/pages/TermosUso.jsx`
- Create: `conduta/frontend/src/pages/PoliticaPrivacidade.jsx`
- Modify: `conduta/frontend/src/App.jsx`

- [ ] **Step 1: Criar `LegalPage.module.scss`**

```scss
@use '../styles/variables' as *;

.page {
  min-height: 100vh;
  background: $color-bg;
  padding: 48px 24px;
}

.container {
  max-width: 720px;
  margin: 0 auto;
  background: $color-surface;
  border-radius: $border-radius;
  padding: 48px 56px;
  box-shadow: $shadow-sm;
}

.brand {
  font-size: 13px;
  font-weight: 700;
  letter-spacing: 3px;
  text-transform: uppercase;
  color: $color-accent;
  margin-bottom: 32px;

  a {
    color: $color-accent;
    text-decoration: none;

    &:hover {
      text-decoration: underline;
    }
  }
}

.title {
  font-size: 22px;
  font-weight: 700;
  color: $color-text-primary;
  margin-bottom: 4px;
}

.updated {
  font-size: $font-size-sm;
  color: $color-text-secondary;
  margin-bottom: 40px;
}

.section {
  margin-bottom: 32px;

  h2 {
    font-size: $font-size-lg;
    font-weight: 700;
    color: $color-text-primary;
    margin-bottom: 10px;
  }

  p {
    font-size: $font-size-base;
    color: $color-text-primary;
    line-height: 1.7;
    margin-bottom: 10px;
  }

  ul {
    margin: 8px 0 10px 20px;
    list-style: disc;

    li {
      font-size: $font-size-base;
      color: $color-text-primary;
      line-height: 1.7;
      margin-bottom: 4px;
    }
  }
}

.warning {
  background: #fff8e1;
  border-left: 3px solid $color-warning;
  border-radius: 4px;
  padding: 14px 16px;
  margin-bottom: 10px;

  p {
    color: #7a5100;
    margin-bottom: 0;
  }
}

.footer {
  margin-top: 40px;
  padding-top: 20px;
  border-top: 1px solid $color-border;
  font-size: $font-size-sm;
  color: $color-text-secondary;

  a {
    color: $color-accent;

    &:hover {
      text-decoration: underline;
    }
  }
}

@media (max-width: 600px) {
  .container {
    padding: 32px 24px;
  }
}
```

- [ ] **Step 2: Criar `TermosUso.jsx`**

```jsx
import { Link } from 'react-router-dom';
import styles from './LegalPage.module.scss';

export default function TermosUso() {
  return (
    <div className={styles.page}>
      <div className={styles.container}>
        <p className={styles.brand}><Link to="/">← Conduta</Link></p>
        <h1 className={styles.title}>Termos de Uso</h1>
        <p className={styles.updated}>Última atualização: 11 de maio de 2026</p>

        <div className={styles.section}>
          <h2>1. Natureza do serviço</h2>
          <p>
            O Conduta é uma plataforma de apoio ao raciocínio clínico mediada por inteligência
            artificial. As análises geradas pelo sistema são sugestões baseadas em modelos de
            linguagem e em uma base de conhecimento clínico estruturada. O Conduta <strong>não
            realiza diagnóstico médico</strong>, não emite prescrições e não substitui a avaliação
            ou a conduta de um profissional de saúde habilitado.
          </p>
        </div>

        <div className={styles.section}>
          <h2>2. Público autorizado</h2>
          <p>O uso do Conduta é permitido exclusivamente a:</p>
          <ul>
            <li>Médicos com registro ativo no Conselho Regional de Medicina (CRM);</li>
            <li>
              Estudantes regularmente matriculados em curso de medicina, exclusivamente sob
              supervisão direta de profissional habilitado.
            </li>
          </ul>
          <p>O cadastro por pessoa fora desses perfis é expressamente vedado.</p>
        </div>

        <div className={styles.section}>
          <h2>3. Responsabilidade do usuário</h2>
          <p>
            Toda e qualquer decisão clínica — diagnóstica, terapêutica ou prescritiva — é de
            responsabilidade exclusiva do profissional que a tomar. O usuário reconhece que:
          </p>
          <ul>
            <li>O sistema pode conter erros, imprecisões ou informações desatualizadas;</li>
            <li>Todo output deve ser verificado criticamente antes de qualquer aplicação clínica;</li>
            <li>
              O uso da plataforma não elimina a obrigação de observar as normas do CFM e as boas
              práticas da medicina baseada em evidências.
            </li>
          </ul>
        </div>

        <div className={styles.section}>
          <h2>4. Limitação de responsabilidade</h2>
          <p>
            Na máxima extensão permitida pela lei, o prestador do serviço não responde por danos
            diretos, indiretos, emergentes, incidentais, consequenciais ou punitivos decorrentes do
            uso ou da impossibilidade de uso da plataforma, incluindo, sem limitação, danos causados
            a pacientes ou a terceiros em razão de decisões clínicas baseadas nos outputs do sistema.
          </p>
        </div>

        <div className={styles.section}>
          <h2>5. Indenização</h2>
          <p>
            O usuário concorda em defender, indenizar e manter o prestador do serviço isento de
            quaisquer demandas, ações judiciais, responsabilidades, danos, perdas, custos e despesas
            (incluindo honorários advocatícios razoáveis) decorrentes de: (a) violação destes Termos;
            (b) uso indevido da plataforma; (c) atos ou omissões do usuário no exercício de suas
            atividades clínicas.
          </p>
        </div>

        <div className={styles.section}>
          <h2>6. Vedações</h2>
          <p>É expressamente vedado:</p>
          <ul>
            <li>Usar o Conduta para elaboração de laudos periciais, documentos médico-legais ou qualquer documento oficial;</li>
            <li>Automatizar decisões clínicas sem supervisão humana;</li>
            <li>Compartilhar credenciais de acesso;</li>
            <li>Inserir dados que permitam identificar pacientes (nome, CPF, data de nascimento, número de prontuário etc.);</li>
            <li>Usar a plataforma para finalidade diversa do apoio ao raciocínio clínico educacional.</li>
          </ul>
        </div>

        <div className={styles.section}>
          <h2>7. Alterações e rescisão</h2>
          <p>
            O prestador pode alterar estes Termos a qualquer momento, com notificação por e-mail ao
            usuário com antecedência mínima de 15 (quinze) dias. O uso continuado da plataforma após
            a vigência das alterações constitui aceite. O prestador pode suspender ou encerrar contas
            que violem estes Termos, sem aviso prévio, reservando-se o direito de excluir dados
            associados.
          </p>
        </div>

        <div className={styles.section}>
          <h2>8. Lei aplicável e foro</h2>
          <p>
            Estes Termos são regidos pelas leis da República Federativa do Brasil. Para dirimir
            quaisquer controvérsias decorrentes deste instrumento, fica eleito o foro da Comarca de
            Mogi das Cruzes, Estado de São Paulo, com renúncia expressa a qualquer outro, por mais
            privilegiado que seja.
          </p>
        </div>

        <div className={styles.footer}>
          <Link to="/privacidade">Política de Privacidade</Link>
          {' · '}
          <a href="mailto:app.conduta@gmail.com">app.conduta@gmail.com</a>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Criar `PoliticaPrivacidade.jsx`**

```jsx
import { Link } from 'react-router-dom';
import styles from './LegalPage.module.scss';

export default function PoliticaPrivacidade() {
  return (
    <div className={styles.page}>
      <div className={styles.container}>
        <p className={styles.brand}><Link to="/">← Conduta</Link></p>
        <h1 className={styles.title}>Política de Privacidade</h1>
        <p className={styles.updated}>Última atualização: 11 de maio de 2026</p>

        <div className={styles.section}>
          <h2>1. Dados coletados</h2>
          <p>Coletamos os seguintes dados pessoais:</p>
          <ul>
            <li>Nome completo e endereço de e-mail;</li>
            <li>Senha (armazenada em formato hash — nunca em texto claro);</li>
            <li>Textos dos casos clínicos inseridos na plataforma;</li>
            <li>Data e hora do cadastro e do aceite dos Termos de Uso;</li>
            <li>Endereço IP de acesso.</li>
          </ul>
        </div>

        <div className={styles.section}>
          <h2>2. Aviso importante — dados de pacientes</h2>
          <div className={styles.warning}>
            <p>
              <strong>Não insira, nos casos clínicos, informações que permitam identificar
              individualmente um paciente</strong> — tais como nome, CPF, RG, data de nascimento
              completa, número de prontuário ou qualquer outro dado pessoal sensível. O sigilo de
              informações de pacientes é dever do profissional de saúde, nos termos do Código de
              Ética Médica e da Lei Geral de Proteção de Dados (LGPD — Lei nº 13.709/2018). A
              responsabilidade pela inserção de tais dados é integralmente do usuário.
            </p>
          </div>
        </div>

        <div className={styles.section}>
          <h2>3. Base legal</h2>
          <p>
            O tratamento de dados pessoais realizado nesta plataforma tem como base legal o
            consentimento do titular (art. 7º, inciso I, da LGPD), manifestado no momento do
            cadastro mediante marcação do campo de aceite, com registro de data e hora.
          </p>
        </div>

        <div className={styles.section}>
          <h2>4. Finalidade</h2>
          <p>Seus dados são utilizados para:</p>
          <ul>
            <li>Prestação do serviço de apoio ao raciocínio clínico;</li>
            <li>Manutenção e segurança da conta;</li>
            <li>Comunicações sobre o serviço (atualizações, avisos de alteração dos Termos);</li>
            <li>Melhoria da plataforma a partir de análise agregada e anonimizada de padrões de uso.</li>
          </ul>
        </div>

        <div className={styles.section}>
          <h2>5. Compartilhamento de dados</h2>
          <p>
            Os textos inseridos nos casos clínicos são processados pela API do{' '}
            <strong>OpenRouter</strong> (openrouter.ai), serviço de terceiro responsável pelo
            roteamento de requisições a modelos de linguagem. O OpenRouter processa esses dados de
            acordo com sua própria política de privacidade. Não realizamos venda, aluguel ou
            compartilhamento de dados pessoais para fins comerciais.
          </p>
        </div>

        <div className={styles.section}>
          <h2>6. Retenção</h2>
          <p>
            Seus dados são mantidos enquanto sua conta estiver ativa. Após o encerramento da conta,
            os dados são retidos por 12 (doze) meses e então eliminados, salvo quando a manutenção
            for necessária para cumprimento de obrigação legal ou regulatória.
          </p>
        </div>

        <div className={styles.section}>
          <h2>7. Seus direitos (LGPD)</h2>
          <p>Nos termos da LGPD, você tem direito a:</p>
          <ul>
            <li>Confirmar a existência de tratamento de seus dados;</li>
            <li>Acessar seus dados pessoais;</li>
            <li>Corrigir dados incompletos, inexatos ou desatualizados;</li>
            <li>Solicitar a anonimização, bloqueio ou eliminação de dados desnecessários;</li>
            <li>Revogar o consentimento a qualquer momento.</li>
          </ul>
          <p>
            Para exercer esses direitos, entre em contato pelo e-mail indicado na seção 8. As
            solicitações serão respondidas em até 15 (quinze) dias úteis.
          </p>
        </div>

        <div className={styles.section}>
          <h2>8. Controlador</h2>
          <p>
            O tratamento de dados desta plataforma é realizado por:<br />
            <strong>Victor Jordan</strong> — CPF ***.278.258-**<br />
            E-mail: <a href="mailto:app.conduta@gmail.com">app.conduta@gmail.com</a>
          </p>
        </div>

        <div className={styles.footer}>
          <Link to="/termos">Termos de Uso</Link>
          {' · '}
          <a href="mailto:app.conduta@gmail.com">app.conduta@gmail.com</a>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Adicionar as rotas em `App.jsx`**

Adicionar os imports no topo de `App.jsx`:

```js
import TermosUso from './pages/TermosUso';
import PoliticaPrivacidade from './pages/PoliticaPrivacidade';
```

Adicionar as rotas dentro de `<Routes>`, antes do `<Route path="*" ...>`:

```jsx
<Route path="/termos" element={<TermosUso />} />
<Route path="/privacidade" element={<PoliticaPrivacidade />} />
```

- [ ] **Step 5: Verificar no browser**

```bash
cd conduta/frontend
npm run dev
```

Acessar `http://localhost:5173/termos` e `http://localhost:5173/privacidade` e confirmar que as páginas renderizam corretamente.

- [ ] **Step 6: Commit**

```bash
git add conduta/frontend/src/pages/LegalPage.module.scss \
        conduta/frontend/src/pages/TermosUso.jsx \
        conduta/frontend/src/pages/PoliticaPrivacidade.jsx \
        conduta/frontend/src/App.jsx
git commit -m "feat(frontend): páginas estáticas /termos e /privacidade"
```

---

## Task 5: Frontend — checkbox de aceite no cadastro

**Files:**
- Modify: `conduta/frontend/src/services/api.js`
- Modify: `conduta/frontend/src/pages/Register.jsx`
- Modify: `conduta/frontend/src/pages/Register.module.scss`
- Create: `conduta/frontend/src/__tests__/Register.test.jsx`

- [ ] **Step 1: Escrever o teste que falha**

Criar `conduta/frontend/src/__tests__/Register.test.jsx`:

```jsx
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { vi } from 'vitest';
import Register from '../pages/Register';

vi.mock('../services/api', () => ({ register: vi.fn() }));
vi.mock('../context/AuthContext', () => ({
  useAuth: () => ({ saveAuth: vi.fn() }),
}));

function renderRegister() {
  render(
    <MemoryRouter>
      <Register />
    </MemoryRouter>
  );
}

describe('Register — checkbox de termos', () => {
  it('botão de cadastro começa desabilitado', () => {
    renderRegister();
    expect(screen.getByRole('button', { name: /criar conta/i })).toBeDisabled();
  });

  it('botão permanece desabilitado quando só o checkbox está marcado', async () => {
    renderRegister();
    const user = userEvent.setup();
    await user.click(screen.getByRole('checkbox'));
    expect(screen.getByRole('button', { name: /criar conta/i })).toBeDisabled();
  });

  it('botão habilita quando formulário válido + checkbox marcado', async () => {
    renderRegister();
    const user = userEvent.setup();

    await user.type(screen.getByLabelText('Nome'), 'Dr. Teste');
    await user.type(screen.getByLabelText('E-mail'), 'dr@exemplo.com');
    await user.type(screen.getByLabelText('Senha'), 'Senha123');
    await user.type(screen.getByLabelText('Confirmar senha'), 'Senha123');
    await user.click(screen.getByRole('checkbox'));

    expect(screen.getByRole('button', { name: /criar conta/i })).toBeEnabled();
  });
});
```

- [ ] **Step 2: Rodar o teste para ver falhar**

```bash
cd conduta/frontend
npx vitest run src/__tests__/Register.test.jsx
```

Esperado: `FAIL` — checkbox não existe ainda.

- [ ] **Step 3: Atualizar `api.js` — adicionar `termsAcceptedAt` ao `register()`**

No arquivo `conduta/frontend/src/services/api.js`, substituir a função `register`:

```js
export async function register(nome, email, senha, termsAcceptedAt) {
  const res = await fetch(`${BASE_URL}/auth/signup`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ nome, email, senha, terms_accepted_at: termsAcceptedAt }),
  });

  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || 'Erro ao criar conta.');
  }
  return res.json();
}
```

- [ ] **Step 4: Atualizar `Register.jsx` — adicionar estado e checkbox**

Adicionar `termosAceitos` ao state (junto dos outros `useState`):

```js
const [termosAceitos, setTermosAceitos] = useState(false);
```

Atualizar a chamada de `register` em `handleSubmit`:

```js
const data = await register(nome, email, senha, new Date().toISOString());
```

Atualizar a prop `disabled` do botão submit (substituir a linha do botão):

```jsx
<button
  type="submit"
  className={styles.button}
  disabled={loading || !termosAceitos || !senhaValida || !coincidem}
>
  {loading ? 'Criando conta...' : 'Criar conta grátis'}
</button>
```

Adicionar o checkbox imediatamente antes do botão submit (entre o último campo e o botão):

```jsx
<div className={styles.termosField}>
  <label className={styles.termosLabel}>
    <input
      type="checkbox"
      checked={termosAceitos}
      onChange={(e) => setTermosAceitos(e.target.checked)}
    />
    <span>
      Li e concordo com os{' '}
      <a href="/termos" target="_blank" rel="noreferrer">Termos de Uso</a>
      {' '}e a{' '}
      <a href="/privacidade" target="_blank" rel="noreferrer">Política de Privacidade</a>
    </span>
  </label>
</div>
```

- [ ] **Step 5: Adicionar estilos do checkbox em `Register.module.scss`**

Adicionar ao final do arquivo:

```scss
.termosField {
  margin-bottom: 16px;
}

.termosLabel {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  cursor: pointer;
  font-size: $font-size-sm;
  color: $color-text-secondary;
  line-height: 1.5;
  font-weight: 400;
  text-transform: none;
  letter-spacing: 0;

  input[type='checkbox'] {
    width: auto;
    margin-top: 2px;
    flex-shrink: 0;
    accent-color: $color-accent;
    cursor: pointer;
  }

  a {
    color: $color-accent;
    font-weight: 600;

    &:hover {
      text-decoration: underline;
    }
  }
}
```

- [ ] **Step 6: Rodar o teste de novo**

```bash
npx vitest run src/__tests__/Register.test.jsx
```

Esperado: `PASS` nos 3 testes.

- [ ] **Step 7: Verificar no browser**

Acessar `http://localhost:5173/cadastro`. Confirmar que:
- Botão começa desabilitado
- Botão só habilita com checkbox marcado + formulário válido
- Links do checkbox abrem em nova aba

- [ ] **Step 8: Commit**

```bash
git add conduta/frontend/src/services/api.js \
        conduta/frontend/src/pages/Register.jsx \
        conduta/frontend/src/pages/Register.module.scss \
        conduta/frontend/src/__tests__/Register.test.jsx
git commit -m "feat(register): checkbox de aceite de termos obrigatório no cadastro"
```

---

## Task 6: Frontend — banner de aviso clínico no Dashboard

**Files:**
- Modify: `conduta/frontend/src/pages/Dashboard.jsx`
- Modify: `conduta/frontend/src/pages/Dashboard.module.scss`

- [ ] **Step 1: Adicionar o banner em `Dashboard.jsx`**

Após o bloco `<header className={styles.mobileHeader}>...</header>`, adicionar:

```jsx
<div className={styles.clinicalBanner} role="status" aria-label="Aviso clínico">
  <span className={styles.clinicalBannerIcon}>⚕</span>
  <span>
    As análises do Conduta são sugestões de apoio clínico.
    A decisão final é sempre responsabilidade do profissional.
  </span>
</div>
```

- [ ] **Step 2: Adicionar estilos em `Dashboard.module.scss`**

Adicionar ao final do arquivo:

```scss
.clinicalBanner {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 20px;
  background: #f0f4f8;
  border-bottom: 1px solid $color-border;
  font-size: $font-size-sm;
  color: $color-text-secondary;
  flex-shrink: 0;
}

.clinicalBannerIcon {
  font-size: 15px;
  flex-shrink: 0;
}
```

- [ ] **Step 3: Verificar no browser**

Fazer login e confirmar que o banner aparece no topo do Dashboard, não é fechável, e tem estilo neutro sem chamar atenção excessiva.

- [ ] **Step 4: Commit**

```bash
git add conduta/frontend/src/pages/Dashboard.jsx \
        conduta/frontend/src/pages/Dashboard.module.scss
git commit -m "feat(dashboard): banner de aviso clínico permanente"
```

---

## Task 7: Frontend — disclaimer no rodapé de cada resposta da IA

**Files:**
- Modify: `conduta/frontend/src/components/AnalysisResult.jsx`
- Modify: `conduta/frontend/src/components/AnalysisResult.module.scss`

- [ ] **Step 1: Adicionar o disclaimer em `AnalysisResult.jsx`**

No bloco `assistantMessage`, após `<FeedbackButtons ...>` e antes do fechamento da `<div>`, adicionar:

```jsx
{(!streaming || i < messages.length - 1) && (
  <p className={styles.aiDisclaimer}>
    Esta análise é gerada por inteligência artificial e não substitui o julgamento clínico do profissional.
  </p>
)}
```

O trecho do `assistantMessage` ficará assim (mostrando o contexto completo):

```jsx
<div key={i} className={styles.assistantMessage}>
  <div className={styles.content}>
    <ReactMarkdown>{msg.content}</ReactMarkdown>
    {streaming && i === messages.length - 1 && (
      <span className={styles.cursor} />
    )}
  </div>
  {(!streaming || i < messages.length - 1) && (
    <FeedbackButtons
      messageId={msg.id}
      current={msg.feedback}
      onFeedback={onFeedback}
    />
  )}
  {(!streaming || i < messages.length - 1) && (
    <p className={styles.aiDisclaimer}>
      Esta análise é gerada por inteligência artificial e não substitui o julgamento clínico do profissional.
    </p>
  )}
</div>
```

- [ ] **Step 2: Adicionar estilos em `AnalysisResult.module.scss`**

Adicionar ao final do arquivo:

```scss
.aiDisclaimer {
  font-size: 11px;
  color: $color-text-secondary;
  margin-top: 12px;
  padding-top: 10px;
  border-top: 1px solid $color-border;
  line-height: 1.5;
}
```

- [ ] **Step 3: Verificar no browser**

Enviar um caso de teste e confirmar que o disclaimer aparece abaixo dos botões de feedback em cada resposta concluída, com estilo discreto.

- [ ] **Step 4: Commit**

```bash
git add conduta/frontend/src/components/AnalysisResult.jsx \
        conduta/frontend/src/components/AnalysisResult.module.scss
git commit -m "feat(analysis): disclaimer de IA no rodapé de cada resposta"
```

---

## Task 8: Frontend — footer com links no Dashboard

**Files:**
- Modify: `conduta/frontend/src/pages/Dashboard.jsx`
- Modify: `conduta/frontend/src/pages/Dashboard.module.scss`

- [ ] **Step 1: Adicionar o footer em `Dashboard.jsx`**

Antes do fechamento de `</main>` (último elemento dentro de `<main className={styles.main}>`), adicionar:

```jsx
<footer className={styles.footer}>
  <a href="/termos" target="_blank" rel="noreferrer">Termos de Uso</a>
  {' · '}
  <a href="/privacidade" target="_blank" rel="noreferrer">Política de Privacidade</a>
</footer>
```

- [ ] **Step 2: Adicionar estilos em `Dashboard.module.scss`**

Adicionar ao final do arquivo:

```scss
.footer {
  padding: 10px 20px;
  border-top: 1px solid $color-border;
  font-size: 11px;
  color: $color-text-secondary;
  flex-shrink: 0;

  a {
    color: $color-text-secondary;
    text-decoration: none;

    &:hover {
      color: $color-accent;
      text-decoration: underline;
    }
  }
}
```

- [ ] **Step 3: Verificar no browser**

Confirmar que o footer aparece na base do dashboard com os dois links funcionando (abrem em nova aba as páginas criadas na Task 4).

- [ ] **Step 4: Commit final**

```bash
git add conduta/frontend/src/pages/Dashboard.jsx \
        conduta/frontend/src/pages/Dashboard.module.scss
git commit -m "feat(dashboard): footer com links para termos e privacidade"
```

---

## Checklist de verificação final

Antes de considerar concluído, verificar manualmente:

- [ ] `/termos` e `/privacidade` renderizam sem erros (acessíveis sem login)
- [ ] No `/cadastro`: botão desabilitado sem checkbox; checkbox funciona; links abrem em nova aba
- [ ] Cadastro bem-sucedido → DB tem `terms_accepted_at` preenchido
- [ ] Dashboard mostra banner clínico permanente (não fechável)
- [ ] Respostas da IA mostram disclaimer após loading (não durante streaming)
- [ ] Footer do Dashboard tem os dois links funcionando
- [ ] Todos os testes passam: `npx jest --no-coverage` (backend) e `npx vitest run` (frontend)

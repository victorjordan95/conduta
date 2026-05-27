# Sequências Rápidas — Design Spec

**Data:** 2026-05-27  
**Status:** Aprovado  
**Escopo:** Frontend apenas (conteúdo estático)

---

## Visão Geral

Adicionar uma seção de **Sequências Rápidas** ao Conduta: protocolos clínicos de emergência apresentados em passos numerados, acessíveis via URL própria para favoritar no celular durante plantão.

São 10 protocolos no MVP:

| Slug | Título |
|---|---|
| `sri` | Sequência Rápida de Intubação |
| `pcr` | Parada Cardiorrespiratória (ACLS) |
| `anafilaxia` | Anafilaxia |
| `avc-agudo` | AVC Agudo |
| `sepse` | Sepse |
| `eme` | Estado de Mal Epiléptico |
| `cad` | Cetoacidose Diabética |
| `sca` | Síndrome Coronariana Aguda |
| `eap` | Edema Agudo de Pulmão |
| `crise-hipertensiva` | Crise Hipertensiva |

---

## Rotas

```
/protocolos           → lista (grid de cards)
/protocolos/:slug     → detalhe do protocolo
```

Ambas são rotas protegidas (`PrivateRoute`) — apenas usuários autenticados acessam.

---

## Estrutura de Arquivos

```
frontend/src/
├── data/
│   └── protocolos.js              ← fonte única dos 10 protocolos
├── pages/
│   ├── Protocolos.jsx             ← página lista
│   ├── Protocolos.module.scss
│   ├── ProtocoloDetalhe.jsx       ← página detalhe
│   └── ProtocoloDetalhe.module.scss
```

Modificações em arquivos existentes:
- `frontend/src/App.jsx` — adicionar 2 novas rotas
- `frontend/src/components/Sidebar.jsx` — adicionar link "Protocolos" na navegação
- `frontend/src/components/Sidebar.module.scss` — estilos do novo link

---

## Modelo de Dados (`protocolos.js`)

```js
// Tipos de passo:
// { tipo: 'acao', texto: string }
// { tipo: 'droga', nome: string, dose: string, obs?: string }
// { tipo: 'alerta', texto: string }   ← para avisos críticos (ex: "NÃO usar succinilcolina em...")

const protocolo = {
  slug: 'sri',
  titulo: 'Sequência Rápida de Intubação',
  icone: '🫁',
  categoria: 'via-aerea',          // usado para badge de cor
  tags: ['via aérea', 'emergência'],
  fases: [
    {
      nome: 'Preparação (0–5 min)',
      passos: [
        { tipo: 'acao', texto: 'Posicionar em sniffing position (coxim suboccipital)' },
        { tipo: 'droga', nome: 'Atropina', dose: '0,5 mg IV', obs: 'se FC < 60 bpm ou pediátrico' },
      ]
    }
  ],
  referencia: 'Diretrizes AMB / UpToDate 2024'
}
```

**Categorias e cores de badge:**
- `via-aerea` — azul
- `cardiovascular` — vermelho
- `neurologico` — roxo
- `metabolico` — laranja
- `infeccioso` — verde

---

## Componentes e Páginas

### `Protocolos.jsx` — Lista

- Grid responsivo de cards (2 colunas mobile, 3 desktop)
- Cada card: ícone grande, título, tags coloridas
- Link `<Link to={/protocolos/${p.slug}}>` em cada card
- Sem filtro/busca no MVP

### `ProtocoloDetalhe.jsx` — Detalhe

- Lê `useParams().slug`, encontra o protocolo em `protocolos.js`
- Redireciona para `/protocolos` se slug não existir (404 silencioso)
- Header: `← Protocolos` + ícone + título + badge de categoria
- Fases em seções com título em destaque
- Passos numerados dentro de cada fase:
  - `tipo: 'acao'` → texto simples
  - `tipo: 'droga'` → badge colorido com `nome · dose` + obs em itálico
  - `tipo: 'alerta'` → caixa amarela/vermelha com ícone ⚠️
- Rodapé: referência bibliográfica em texto menor

### `Sidebar.jsx` — Navegação

Nova entrada fixa logo abaixo do botão `+ Novo caso`:

```
[ ⚡ Protocolos ]   ← link para /protocolos
───────────────────
Casos anteriores
[ lista de sessões ]
```

---

## Conteúdo dos Protocolos

Os 10 protocolos serão baseados em:
- **SRI:** Miller's Anesthesia + UpToDate
- **PCR:** AHA ACLS Guidelines 2020 (atualizado 2023)
- **Anafilaxia:** WAO Guidelines 2023
- **AVC Agudo:** AHA/ASA Stroke Guidelines 2019 (atualizado 2023)
- **Sepse:** Surviving Sepsis Campaign 2021
- **EME:** Epilepsy Foundation + ILAE 2022
- **CAD:** ADA Standards of Care 2024
- **SCA:** ESC Guidelines on ACS 2023
- **EAP:** ESC Heart Failure Guidelines 2021
- **Crise Hipertensiva:** ESC/ESH Hypertension Guidelines 2023

Cada protocolo incluirá as fases relevantes, passos com doses baseadas em peso adulto padrão (70 kg), e alertas para contraindicações críticas.

---

## Fluxo de Dados

```
protocolos.js (static array)
    ↓
Protocolos.jsx  →  lista todos os protocolos
    ↓ (Link)
ProtocoloDetalhe.jsx  →  filtra por slug  →  renderiza fases/passos
```

Sem chamadas de API. Sem estado global. Sem efeitos colaterais.

---

## Responsividade

- Cards da lista: 1 coluna em telas < 480px, 2 colunas até 768px, 3 colunas acima
- Página de detalhe: padding lateral adequado para leitura no celular
- Badges de droga com quebra de linha em telas pequenas
- Sidebar: o link "Protocolos" fecha a sidebar mobile ao navegar (comportamento já existente via `onClose`)

---

## Fora do Escopo (MVP)

- Busca/filtro de protocolos
- Marcação de favoritos
- Modo offline / PWA
- Edição por admins
- Impressão/PDF do protocolo
- Protocolos pediátricos ou por peso

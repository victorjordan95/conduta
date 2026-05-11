import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi } from 'vitest';

vi.mock('../context/AuthContext', () => ({
  useAuth: () => ({
    user: { plan: 'free', coachmarks_welcome_seen: true, coachmarks_session_seen: true },
    token: 'fake-token',
    saveAuth: vi.fn(),
    refreshUser: vi.fn(),
  }),
}));

vi.mock('../services/api', () => ({
  getSessions: vi.fn().mockResolvedValue([]),
  getSession: vi.fn().mockResolvedValue({
    session: { id: 'sess1', titulo: 'Caso Teste', summary: null },
    messages: [],
  }),
  getUsage: vi.fn().mockResolvedValue({ used: 0, limit: 15 }),
  analyzeCase: vi.fn(),
  submitFeedback: vi.fn(),
  downloadSessionPdf: vi.fn(),
  getSessionEntities: vi.fn().mockResolvedValue({ diagnosticos: [], medicamentos: [] }),
}));

vi.mock('../components/Sidebar', () => ({
  default: ({ onSelectSession }) => (
    <button onClick={() => onSelectSession('sess1')}>Sessão Teste</button>
  ),
}));

vi.mock('../components/CaseInput', () => ({
  default: ({ onSessionMsgCount }) => (
    <div data-testid="case-input">
      <button onClick={() => onSessionMsgCount(8)}>simular 8 msg</button>
      <button onClick={() => onSessionMsgCount(16)}>simular 16 msg</button>
    </div>
  ),
}));

vi.mock('../components/AnalysisResult', () => ({ default: () => <div /> }));
vi.mock('../components/UsageCounter', () => ({ default: () => null }));
vi.mock('../components/Coachmark', () => ({ default: () => null }));

import Dashboard from '../pages/Dashboard';

describe('Dashboard — banners de sessão longa', () => {
  it('não mostra banner quando userMsgCount < 8', async () => {
    render(<Dashboard />);
    fireEvent.click(screen.getByText('Sessão Teste'));
    await waitFor(() => screen.getByTestId('case-input'));

    expect(screen.queryByText(/Contexto longo/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Nova sessão/i)).not.toBeInTheDocument();
  });

  it('mostra banner amarelo quando userMsgCount >= 8 e < 16', async () => {
    render(<Dashboard />);
    fireEvent.click(screen.getByText('Sessão Teste'));
    await waitFor(() => screen.getByTestId('case-input'));

    fireEvent.click(screen.getByText('simular 8 msg'));

    expect(screen.getByText(/Contexto longo/i)).toBeInTheDocument();
    expect(screen.queryByText(/Nova sessão/i)).not.toBeInTheDocument();
  });

  it('mostra banner laranja com botão Nova sessão quando userMsgCount >= 16', async () => {
    render(<Dashboard />);
    fireEvent.click(screen.getByText('Sessão Teste'));
    await waitFor(() => screen.getByTestId('case-input'));

    fireEvent.click(screen.getByText('simular 16 msg'));

    expect(screen.getByRole('button', { name: /Nova sessão/i })).toBeInTheDocument();
    expect(screen.queryByText(/Contexto longo/i)).not.toBeInTheDocument();
  });

  it('botão Nova sessão limpa a sessão ativa', async () => {
    render(<Dashboard />);
    fireEvent.click(screen.getByText('Sessão Teste'));
    await waitFor(() => screen.getByTestId('case-input'));
    fireEvent.click(screen.getByText('simular 16 msg'));

    fireEvent.click(screen.getByRole('button', { name: /Nova sessão/i }));

    expect(screen.queryByTestId('case-input')).not.toBeInTheDocument();
  });
});

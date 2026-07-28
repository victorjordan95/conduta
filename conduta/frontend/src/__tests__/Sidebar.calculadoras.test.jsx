import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { SWRConfig } from 'swr';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import Sidebar from '../components/Sidebar';
import { getSessions } from '../services/api';

vi.mock('../context/AuthContext', () => ({
  useAuth: () => ({
    user: { nome: 'Victor', role: 'user', plan: 'free' },
    clearAuth: vi.fn(),
  }),
}));

vi.mock('../services/api', () => ({
  getSessions: vi.fn().mockResolvedValue([]),
  createSession: vi.fn(),
  renameSession: vi.fn(),
  deleteSession: vi.fn(),
  createCheckoutSession: vi.fn(),
  getBillingPortalUrl: vi.fn(),
}));

describe('Sidebar autenticada', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  function renderSidebar(cache = new Map()) {
    return render(
      <SWRConfig value={{ provider: () => cache, revalidateIfStale: false, revalidateOnFocus: false, revalidateOnReconnect: false }}>
        <MemoryRouter>
          <Sidebar
            activeSessionId={null}
            onSelectSession={() => {}}
            onNewSession={() => {}}
            onSessionDeleted={() => {}}
            isOpen
            onClose={() => {}}
          />
        </MemoryRouter>
      </SWRConfig>,
    );
  }

  it('exibe acesso público às calculadoras para usuário logado', async () => {
    renderSidebar();

    expect(screen.getByRole('link', { name: 'Calculadoras' })).toHaveAttribute('href', '/calculadoras');
    expect(screen.getByRole('link', { name: 'Protocolos' })).toHaveAttribute('href', '/protocolos');
    await waitFor(() => expect(getSessions).toHaveBeenCalledTimes(1));
  });

  it('reutiliza as sessões cacheadas ao remontar o Sidebar', async () => {
    getSessions.mockResolvedValue([{ id: 'sessao-1', titulo: 'Caso cacheado', created_at: '2026-07-28T12:00:00.000Z' }]);
    const cache = new Map();

    const firstRender = renderSidebar(cache);
    await waitFor(() => expect(screen.getByText('Caso cacheado')).toBeInTheDocument());
    firstRender.unmount();

    renderSidebar(cache);
    await waitFor(() => expect(screen.getByText('Caso cacheado')).toBeInTheDocument());

    expect(getSessions).toHaveBeenCalledTimes(1);
  });
});

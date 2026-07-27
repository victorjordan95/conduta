import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import Sidebar from '../components/Sidebar';

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
  it('exibe acesso público às calculadoras para usuário logado', () => {
    render(
      <MemoryRouter>
        <Sidebar
          activeSessionId={null}
          onSelectSession={() => {}}
          onNewSession={() => {}}
          onSessionDeleted={() => {}}
          isOpen
          onClose={() => {}}
        />
      </MemoryRouter>,
    );

    expect(screen.getByRole('link', { name: 'Calculadoras' })).toHaveAttribute('href', '/calculadoras');
    expect(screen.getByRole('link', { name: 'Protocolos' })).toHaveAttribute('href', '/protocolos');
  });
});

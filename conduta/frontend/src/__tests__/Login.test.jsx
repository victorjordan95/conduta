import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { AuthProvider } from '../context/AuthContext';
import Login from '../pages/Login';
import * as api from '../services/api';
import { vi } from 'vitest';

vi.mock('../services/api');

function renderLogin() {
  return render(
    <AuthProvider>
      <MemoryRouter>
        <Login />
      </MemoryRouter>
    </AuthProvider>
  );
}

describe('Login', () => {
  it('renderiza campos de email e senha', () => {
    renderLogin();
    expect(screen.getByLabelText(/e-mail/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/senha/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /entrar/i })).toBeInTheDocument();
  });

  it('exibe erro com credenciais inválidas', async () => {
    api.login.mockRejectedValue(new Error('Credenciais inválidas.'));
    renderLogin();

    fireEvent.change(screen.getByLabelText(/e-mail/i), {
      target: { value: 'errado@teste.com' },
    });
    fireEvent.change(screen.getByLabelText(/senha/i), {
      target: { value: 'errada' },
    });
    fireEvent.click(screen.getByRole('button', { name: /entrar/i }));

    await waitFor(() => {
      expect(screen.getByText(/credenciais inválidas/i)).toBeInTheDocument();
    });
  });
});

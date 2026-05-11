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

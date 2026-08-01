import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import PlantaoQuickActions from '../components/PlantaoQuickActions';

function renderQuickActions(onNewCase = vi.fn()) {
  return render(
    <MemoryRouter>
      <PlantaoQuickActions onNewCase={onNewCase} />
    </MemoryRouter>,
  );
}

describe('PlantaoQuickActions', () => {
  it('renderiza ações principais e links clínicos', () => {
    renderQuickActions();

    expect(screen.getByRole('button', { name: /novo caso/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /^protocolos$/i })).toHaveAttribute('href', '/protocolos');
    expect(screen.getByRole('link', { name: /^calculadoras$/i })).toHaveAttribute('href', '/calculadoras');
  });

  it('funciona em um layout sem contexto do React Router', () => {
    render(<PlantaoQuickActions onNewCase={vi.fn()} />);

    expect(screen.getByRole('link', { name: /^protocolos$/i })).toHaveAttribute('href', '/protocolos');
  });

  it('aciona a criação de caso pelo atalho principal', async () => {
    const user = userEvent.setup();
    const onNewCase = vi.fn();
    renderQuickActions(onNewCase);

    await user.click(screen.getByRole('button', { name: /novo caso/i }));

    expect(onNewCase).toHaveBeenCalledTimes(1);
  });

  it('filtra um protocolo pela busca e mostra estado sem resultado', async () => {
    const user = userEvent.setup();
    renderQuickActions();
    const search = screen.getByRole('searchbox', { name: /buscar ferramenta/i });

    await user.type(search, 'intubação');
    expect(screen.getByRole('link', { name: /sequência rápida de intubação/i })).toBeInTheDocument();

    await user.clear(search);
    await user.type(search, 'xyz inexistente');
    expect(screen.getByRole('status')).toHaveTextContent(/nenhum protocolo ou calculadora/i);
  });

  it('foca a busca com barra ou Ctrl/Cmd+K fora de campos editáveis', () => {
    renderQuickActions();
    const search = screen.getByRole('searchbox', { name: /buscar ferramenta/i });

    fireEvent.keyDown(document, { key: '/' });

    expect(search).toHaveFocus();
  });
});

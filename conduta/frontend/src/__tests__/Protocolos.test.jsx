import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import Protocolos from '../pages/Protocolos';

function renderWithRouter() {
  return render(
    <MemoryRouter>
      <Protocolos />
    </MemoryRouter>
  );
}

describe('Protocolos (lista)', () => {
  it('renderiza o título da seção', () => {
    renderWithRouter();
    expect(screen.getByRole('heading', { name: /Sequências Rápidas/i })).toBeInTheDocument();
  });

  it('renderiza 10 cards de protocolos', () => {
    renderWithRouter();
    const links = screen.getAllByRole('link');
    const cardLinks = links.filter((l) => l.getAttribute('href')?.startsWith('/protocolos/'));
    expect(cardLinks).toHaveLength(10);
  });

  it('cada card exibe o título do protocolo', () => {
    renderWithRouter();
    expect(screen.getByText('Sequência Rápida de Intubação')).toBeInTheDocument();
    expect(screen.getByText('Parada Cardiorrespiratória (ACLS)')).toBeInTheDocument();
    expect(screen.getByText('Anafilaxia')).toBeInTheDocument();
  });

  it('o link de cada card aponta para o slug correto', () => {
    renderWithRouter();
    const sriLink = screen.getByRole('link', { name: /Sequência Rápida de Intubação/i });
    expect(sriLink).toHaveAttribute('href', '/protocolos/sri');
  });
});

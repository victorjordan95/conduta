import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { protocolos } from '../data/protocolos';
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

  it('renderiza card para cada protocolo', () => {
    renderWithRouter();
    const cards = screen.getAllByTestId('protocolo-card');
    expect(cards).toHaveLength(protocolos.length);
  });

  it('renderiza o título de todos os protocolos', () => {
    renderWithRouter();
    protocolos.forEach((p) => {
      expect(screen.getByText(p.titulo)).toBeInTheDocument();
    });
  });

  it('o link de cada card aponta para o slug correto', () => {
    renderWithRouter();
    protocolos.forEach((p) => {
      const escapedTitulo = p.titulo.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const link = screen.getByRole('link', { name: new RegExp(escapedTitulo, 'i') });
      expect(link).toHaveAttribute('href', `/protocolos/${p.slug}`);
    });
  });
});

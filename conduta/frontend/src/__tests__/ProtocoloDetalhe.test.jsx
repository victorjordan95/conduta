import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import ProtocoloDetalhe from '../pages/ProtocoloDetalhe';

function renderDetalhe(slug) {
  return render(
    <MemoryRouter initialEntries={[`/protocolos/${slug}`]}>
      <Routes>
        <Route path="/protocolos/:slug" element={<ProtocoloDetalhe />} />
        <Route path="/protocolos" element={<div>Lista</div>} />
      </Routes>
    </MemoryRouter>
  );
}

describe('ProtocoloDetalhe', () => {
  it('renderiza o título do protocolo correto', () => {
    renderDetalhe('sri');
    expect(screen.getByRole('heading', { name: /Sequência Rápida de Intubação/i })).toBeInTheDocument();
  });

  it('renderiza as fases do protocolo', () => {
    renderDetalhe('sri');
    expect(screen.getByText(/Preparação/i)).toBeInTheDocument();
    expect(screen.getByText(/Indução e Paralisia/i)).toBeInTheDocument();
  });

  it('renderiza badges de droga com nome e dose', () => {
    renderDetalhe('sri');
    expect(screen.getByText(/Etomidato/i)).toBeInTheDocument();
    expect(screen.getByText(/0,3 mg\/kg IV/i)).toBeInTheDocument();
  });

  it('renderiza alertas', () => {
    renderDetalhe('sri');
    expect(screen.getByText(/NÃO usar succinilcolina/i)).toBeInTheDocument();
  });

  it('redireciona para /protocolos se slug não existe', () => {
    renderDetalhe('slug-inexistente');
    expect(screen.getByText('Lista')).toBeInTheDocument();
  });

  it('link de voltar aponta para /protocolos', () => {
    renderDetalhe('pcr');
    const backLink = screen.getByRole('link', { name: /Protocolos/i });
    expect(backLink).toHaveAttribute('href', '/protocolos');
  });
});

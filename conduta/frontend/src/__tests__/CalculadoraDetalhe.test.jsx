import { describe, expect, it } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import CalculadoraDetalhe from '../pages/CalculadoraDetalhe';

function renderSlug(slug) {
  return render(
    <MemoryRouter initialEntries={[`/calculadoras/${slug}`]}>
      <Routes><Route path="/calculadoras/:slug" element={<CalculadoraDetalhe />} /></Routes>
    </MemoryRouter>
  );
}

describe('CalculadoraDetalhe', () => {
  it('calcula e exibe IMC sem login', () => {
    renderSlug('imc');
    fireEvent.change(screen.getByLabelText(/peso/i), { target: { value: '70' } });
    fireEvent.change(screen.getByLabelText(/altura/i), { target: { value: '175' } });
    fireEvent.click(screen.getByRole('button', { name: /calcular/i }));
    expect(screen.getByText('22,86')).toBeInTheDocument();
    expect(screen.getByText(/Eutrofia/i)).toBeInTheDocument();
  });

  it('aceita decimal com vírgula na entrada', () => {
    renderSlug('superficie-corporal');
    fireEvent.change(screen.getByLabelText(/peso/i), { target: { value: '70,5' } });
    fireEvent.change(screen.getByLabelText(/altura/i), { target: { value: '175,5' } });
    fireEvent.click(screen.getByRole('button', { name: /calcular/i }));
    expect(screen.getByRole('status')).toHaveTextContent(/m²/);
  });

  it('mostra validação em entradas inválidas', () => {
    renderSlug('imc');
    fireEvent.click(screen.getByRole('button', { name: /calcular/i }));
    expect(screen.getByRole('alert')).toHaveTextContent(/preencha/i);
  });
});

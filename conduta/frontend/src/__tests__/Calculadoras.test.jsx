import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import Calculadoras from '../pages/Calculadoras';
import { calculadoras } from '../data/calculadoras';

describe('Calculadoras (lista pública)', () => {
  it('renderiza o título e todos os cards registrados', () => {
    render(<MemoryRouter><Calculadoras /></MemoryRouter>);
    expect(screen.getByRole('heading', { name: /Calculadoras clínicas/i })).toBeInTheDocument();
    expect(screen.getAllByTestId('calculadora-card')).toHaveLength(calculadoras.length);
  });

  it('aponta cada card para o slug correto', () => {
    render(<MemoryRouter><Calculadoras /></MemoryRouter>);
    calculadoras.forEach((calculator) => {
      const escapedTitulo = calculator.titulo.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      expect(screen.getByRole('link', { name: new RegExp(escapedTitulo, 'i') }))
        .toHaveAttribute('href', `/calculadoras/${calculator.slug}`);
    });
  });
});

import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import SourceVersionCard from '../components/SourceVersionCard';

describe('SourceVersionCard', () => {
  it('exibe referência, última revisão e link externo', () => {
    render(
      <SourceVersionCard
        referencia="Fonte clínica"
        atualizadoEm="Julho de 2026"
        referenciaUrl="https://example.com/fonte"
        notaSeguranca="Use como apoio à decisão."
      />,
    );

    expect(screen.getByText('Fonte clínica')).toBeInTheDocument();
    expect(screen.getByText(/julho de 2026/i)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /abrir fonte clínica/i })).toHaveAttribute(
      'href',
      'https://example.com/fonte',
    );
    expect(screen.getByText(/apoio à decisão/i)).toBeInTheDocument();
  });

  it('não cria link quando a URL está ausente', () => {
    render(<SourceVersionCard referencia="Referência textual" atualizadoEm="Julho de 2026" />);

    expect(screen.getByText('Referência textual')).toBeInTheDocument();
    expect(screen.queryByRole('link')).not.toBeInTheDocument();
  });
});

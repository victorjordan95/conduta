import { render, screen, fireEvent } from '@testing-library/react';
import CaseInput from '../components/CaseInput';
import { vi } from 'vitest';

describe('CaseInput', () => {
  it('renderiza textarea e botão Analisar', () => {
    render(
      <CaseInput
        sessionId="abc"
        onAnalysisStart={vi.fn()}
        onChunk={vi.fn()}
        onAnalysisDone={vi.fn()}
      />
    );

    expect(screen.getByPlaceholderText(/descreva o caso/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /analisar/i })).toBeInTheDocument();
  });

  it('botão Analisar fica desabilitado com textarea vazio', () => {
    render(
      <CaseInput
        sessionId="abc"
        onAnalysisStart={vi.fn()}
        onChunk={vi.fn()}
        onAnalysisDone={vi.fn()}
      />
    );

    expect(screen.getByRole('button', { name: /analisar/i })).toBeDisabled();
  });

  it('habilita botão quando há texto', () => {
    render(
      <CaseInput
        sessionId="abc"
        onAnalysisStart={vi.fn()}
        onChunk={vi.fn()}
        onAnalysisDone={vi.fn()}
      />
    );

    fireEvent.change(screen.getByPlaceholderText(/descreva o caso/i), {
      target: { value: 'Paciente 30 anos com febre' },
    });

    expect(screen.getByRole('button', { name: /analisar/i })).not.toBeDisabled();
  });
});

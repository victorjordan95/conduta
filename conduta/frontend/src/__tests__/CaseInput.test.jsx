import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import CaseInput from '../components/CaseInput';
import { vi } from 'vitest';

vi.mock('../context/AuthContext', () => ({
  useAuth: vi.fn(),
}));

vi.mock('../services/api', () => ({
  analyzeCase: vi.fn(),
  classificarLesao: vi.fn(),
}));

import { useAuth } from '../context/AuthContext';
import { analyzeCase, classificarLesao } from '../services/api';

const defaultProps = {
  sessionId: 'abc',
  onAnalysisStart: vi.fn(),
  onChunk: vi.fn(),
  onAnalysisDone: vi.fn(),
  onUsageUpdate: vi.fn(),
  onSessionMsgCount: vi.fn(),
};

beforeEach(() => {
  vi.clearAllMocks();
  useAuth.mockReturnValue({ user: { plan: 'free', role: 'user' } });
  analyzeCase.mockResolvedValue();
});

describe('CaseInput', () => {
  it('renderiza textarea e botão Analisar', () => {
    render(<CaseInput {...defaultProps} />);
    expect(screen.getByPlaceholderText(/descreva o caso/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /analisar/i })).toBeInTheDocument();
  });

  it('botão Analisar fica desabilitado com textarea vazio', () => {
    render(<CaseInput {...defaultProps} />);
    expect(screen.getByRole('button', { name: /analisar/i })).toBeDisabled();
  });

  it('habilita botão quando há texto', () => {
    render(<CaseInput {...defaultProps} />);
    fireEvent.change(screen.getByPlaceholderText(/descreva o caso/i), {
      target: { value: 'Paciente 30 anos com febre' },
    });
    expect(screen.getByRole('button', { name: /analisar/i })).not.toBeDisabled();
  });

  it('não exibe botão de foto para usuário free', () => {
    useAuth.mockReturnValue({ user: { plan: 'free', role: 'user' } });
    render(<CaseInput {...defaultProps} />);
    expect(screen.queryByText(/anexar foto/i)).not.toBeInTheDocument();
  });

  it('exibe botão de foto para usuário pro', () => {
    useAuth.mockReturnValue({ user: { plan: 'pro', role: 'user' } });
    render(<CaseInput {...defaultProps} />);
    expect(screen.getByText(/anexar foto de lesão de pele/i)).toBeInTheDocument();
  });

  it('exibe botão de foto para admin', () => {
    useAuth.mockReturnValue({ user: { plan: 'free', role: 'admin' } });
    render(<CaseInput {...defaultProps} />);
    expect(screen.getByText(/anexar foto de lesão de pele/i)).toBeInTheDocument();
  });

  it('sem foto: chama apenas analyzeCase', async () => {
    useAuth.mockReturnValue({ user: { plan: 'pro', role: 'user' } });
    render(<CaseInput {...defaultProps} />);

    fireEvent.change(screen.getByPlaceholderText(/descreva o caso/i), {
      target: { value: 'Paciente com febre' },
    });
    fireEvent.click(screen.getByRole('button', { name: /analisar/i }));

    await waitFor(() => {
      expect(classificarLesao).not.toHaveBeenCalled();
      expect(analyzeCase).toHaveBeenCalledWith(
        'abc',
        'Paciente com febre',
        expect.any(Function),
        expect.any(Function)
      );
    });
  });

  it('com foto: chama classificarLesao antes de analyzeCase', async () => {
    useAuth.mockReturnValue({ user: { plan: 'pro', role: 'user' } });
    classificarLesao.mockResolvedValue({
      classificacao: 'Classificação de lesão cutânea (IA): Melanoma (87%)\n⚠️ Suporte clínico.',
    });

    render(<CaseInput {...defaultProps} />);

    fireEvent.change(screen.getByPlaceholderText(/descreva o caso/i), {
      target: { value: 'Lesão suspeita' },
    });

    const arquivo = new File(['img'], 'lesao.jpg', { type: 'image/jpeg' });
    const input = document.querySelector('input[type="file"]');
    fireEvent.change(input, { target: { files: [arquivo] } });

    fireEvent.click(screen.getByRole('button', { name: /analisar/i }));

    await waitFor(() => {
      expect(classificarLesao).toHaveBeenCalledWith(arquivo);
      expect(analyzeCase).toHaveBeenCalledWith(
        'abc',
        expect.stringContaining('Melanoma'),
        expect.any(Function),
        expect.any(Function)
      );
      expect(analyzeCase).toHaveBeenCalledWith(
        'abc',
        expect.stringContaining('Lesão suspeita'),
        expect.any(Function),
        expect.any(Function)
      );
    });
  });
});

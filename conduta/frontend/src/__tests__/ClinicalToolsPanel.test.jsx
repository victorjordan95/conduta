import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi } from 'vitest';

vi.mock('../services/api', () => ({
  generateClinicalTool: vi.fn(),
}));

import { generateClinicalTool } from '../services/api';
import ClinicalToolsPanel from '../components/ClinicalToolsPanel';

describe('ClinicalToolsPanel', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('exibe as quatro ferramentas de revisão', () => {
    render(<ClinicalToolsPanel sessionId="sess-1" hasAnalysis />);


    expect(screen.getByRole('button', { name: /Perguntas que podem mudar/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Comparar evolução/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Passagem de caso/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Revisão medicamentosa/i })).toBeInTheDocument();
  });

  it('coleta fatores antes de solicitar revisão medicamentosa', async () => {
    generateClinicalTool.mockResolvedValue({ result: '## Revisão\nConfira a função renal.' });
    render(<ClinicalToolsPanel sessionId="sess-1" hasAnalysis />);

    fireEvent.click(screen.getByRole('button', { name: /Revisão medicamentosa/i }));
    fireEvent.change(screen.getByLabelText(/Medicamentos em uso/i), {
      target: { value: 'metformina' },
    });
    fireEvent.change(screen.getByLabelText(/Alergias/i), {
      target: { value: 'penicilina' },
    });
    fireEvent.click(screen.getByRole('button', { name: /Gerar revisão/i }));

    await waitFor(() => expect(generateClinicalTool).toHaveBeenCalledWith('sess-1', 'medication_review', {
      medications: 'metformina',
      allergies: 'penicilina',
      pregnancy: '',
      renalHepatic: '',
      otherFactors: '',
    }));
    expect(await screen.findByText(/Confira a função renal/i)).toBeInTheDocument();
  });
});

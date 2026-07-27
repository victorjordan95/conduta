const request = require('supertest');
const express = require('express');

const mockQuery = jest.fn();
const mockGenerateClinicalTool = jest.fn();

jest.mock('../db/pg', () => ({ query: mockQuery }));
jest.mock('../db/neo4j', () => null);
jest.mock('../services/prontuario', () => ({ gerarResumoProntuario: jest.fn() }));
jest.mock('../middleware/auth', () => (req, res, next) => {
  req.userId = 'user-1';
  next();
});
jest.mock('../services/clinical-tools', () => ({
  TOOL_NAMES: {
    clarifying_questions: 'Perguntas que podem mudar a análise',
    evolution_comparison: 'Comparar evolução',
    handoff: 'Passagem de caso',
    medication_review: 'Revisão medicamentosa',
  },
  generateClinicalTool: mockGenerateClinicalTool,
}));

const sessionsRouter = require('../routes/sessions');
const app = express();
app.use(express.json());
app.use('/sessions', sessionsRouter);

beforeEach(() => {
  mockQuery.mockReset();
  mockGenerateClinicalTool.mockReset();
});

describe('POST /sessions/:id/clinical-tools', () => {
  it('rejeita uma ferramenta desconhecida sem consultar a sessão', async () => {
    const response = await request(app)
      .post('/sessions/session-1/clinical-tools')
      .send({ tool: 'diagnostico_automatico' });

    expect(response.status).toBe(400);
    expect(mockQuery).not.toHaveBeenCalled();
  });

  it('exige uma análise existente na sessão', async () => {
    mockQuery.mockResolvedValueOnce({ rows: [{ id: 'session-1' }] });
    mockQuery.mockResolvedValueOnce({ rows: [{ role: 'user', content: 'caso' }] });

    const response = await request(app)
      .post('/sessions/session-1/clinical-tools')
      .send({ tool: 'handoff' });

    expect(response.status).toBe(400);
    expect(mockGenerateClinicalTool).not.toHaveBeenCalled();
  });

  it('gera e retorna uma ferramenta para a sessão do usuário', async () => {
    mockQuery.mockResolvedValueOnce({ rows: [{ id: 'session-1' }] });
    mockQuery.mockResolvedValueOnce({
      rows: [
        { role: 'user', content: 'caso clínico' },
        { role: 'assistant', content: 'análise clínica' },
      ],
    });
    mockGenerateClinicalTool.mockResolvedValue('## Passagem de caso\nResumo revisável.');

    const response = await request(app)
      .post('/sessions/session-1/clinical-tools')
      .send({ tool: 'handoff' });

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ tool: 'handoff', result: '## Passagem de caso\nResumo revisável.' });
    expect(mockGenerateClinicalTool).toHaveBeenCalledWith('handoff', [
      { role: 'user', content: 'caso clínico' },
      { role: 'assistant', content: 'análise clínica' },
    ], {});
  });
});

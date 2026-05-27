import { describe, it, expect } from 'vitest';
import { protocolos, getProtocolo } from '../data/protocolos';

const SLUGS_ESPERADOS = [
  'sri', 'pcr', 'anafilaxia', 'avc-agudo', 'sepse',
  'eme', 'cad', 'sca', 'eap', 'crise-hipertensiva',
];

describe('protocolos data', () => {
  it('contém exatamente 10 protocolos', () => {
    expect(protocolos).toHaveLength(10);
  });

  it('todos os slugs esperados estão presentes', () => {
    const slugs = protocolos.map((p) => p.slug);
    SLUGS_ESPERADOS.forEach((slug) => {
      expect(slugs).toContain(slug);
    });
  });

  it('cada protocolo tem campos obrigatórios', () => {
    protocolos.forEach((p) => {
      expect(p.slug, `${p.slug}: sem slug`).toBeTruthy();
      expect(p.titulo, `${p.slug}: sem titulo`).toBeTruthy();
      expect(p.icone, `${p.slug}: sem icone`).toBeTruthy();
      expect(p.categoria, `${p.slug}: sem categoria`).toBeTruthy();
      expect(p.fases, `${p.slug}: sem fases`).toBeDefined();
      expect(p.fases.length, `${p.slug}: fases vazio`).toBeGreaterThan(0);
      expect(p.referencia, `${p.slug}: sem referencia`).toBeTruthy();
    });
  });

  it('cada fase tem nome e pelo menos 1 passo', () => {
    protocolos.forEach((p) => {
      p.fases.forEach((f, fi) => {
        expect(f.nome, `${p.slug} fase ${fi}: sem nome`).toBeTruthy();
        expect(f.passos.length, `${p.slug} fase ${fi}: sem passos`).toBeGreaterThan(0);
      });
    });
  });

  it('cada passo tem tipo válido e texto/nome', () => {
    const tiposValidos = ['acao', 'droga', 'alerta'];
    protocolos.forEach((p) => {
      p.fases.forEach((f) => {
        f.passos.forEach((passo) => {
          expect(tiposValidos, `${p.slug}: tipo inválido "${passo.tipo}"`).toContain(passo.tipo);
          if (passo.tipo === 'acao' || passo.tipo === 'alerta') {
            expect(passo.texto, `${p.slug}: passo sem texto`).toBeTruthy();
          }
          if (passo.tipo === 'droga') {
            expect(passo.nome, `${p.slug}: droga sem nome`).toBeTruthy();
            expect(passo.dose, `${p.slug}: droga sem dose`).toBeTruthy();
          }
        });
      });
    });
  });

  it('getProtocolo retorna o protocolo correto por slug', () => {
    const p = getProtocolo('sri');
    expect(p).not.toBeNull();
    expect(p.titulo).toBe('Sequência Rápida de Intubação');
  });

  it('getProtocolo retorna null para slug inexistente', () => {
    expect(getProtocolo('slug-invalido')).toBeNull();
  });
});

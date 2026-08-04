const { relacoes } = require('../db/seeds/clinical-data');

function protocol(name) {
  return relacoes.find((relation) => relation.diagnostico === name);
}

describe('clinical-data safety guardrails', () => {
  it('does not present flumazenil as routine first-line overdose treatment', () => {
    const flumazenil = protocol('Intoxicação por Benzodiazepínico').medicamentos.find((m) => m.nome === 'Flumazenil');
    expect(flumazenil.linha).not.toBe('1ª');
    expect(`${flumazenil.linha} ${flumazenil.obs}`).toMatch(/não.*rotineiro/i);
  });

  it('does not recommend amiodarone for unstable supraventricular tachycardia', () => {
    const meds = protocol('Taquicardia Supraventricular').medicamentos;
    expect(meds.some((m) => m.nome === 'Amiodarona')).toBe(false);
    expect(meds[0].obs).toMatch(/regular.*QRS estreito.*estável/i);
  });

  it('keeps anaphylaxis adjuncts from claiming prevention of biphasic reactions', () => {
    const meds = protocol('Anafilaxia').medicamentos;
    expect(meds.find((m) => m.nome === 'Hidrocortisona IV').obs).not.toMatch(/previne resposta bifásica/i);
  });

  it('does not use a glucose threshold as the trigger for insulin in HHS', () => {
    const insulin = protocol('Estado Hiperosmolar Hiperglicêmico').medicamentos.find((m) => m.nome === 'Insulina Regular Humana');
    expect(insulin.dose).not.toMatch(/glicemia < 300/i);
    expect(insulin.obs).toMatch(/monitorização.*potássio/i);
  });

  it('only links protocols to catalogued medications', () => {
    const { medicamentos } = require('../db/seeds/clinical-data');
    const catalogued = new Set(medicamentos.map((medicamento) => medicamento.nome));
    const unknown = relacoes
      .flatMap((relation) => relation.medicamentos.map((medicamento) => medicamento.nome))
      .filter((name) => !catalogued.has(name));

    expect(unknown).toEqual([]);
  });
});

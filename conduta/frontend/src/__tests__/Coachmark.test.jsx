import fs from 'node:fs';

describe('Coachmark em mobile', () => {
  it('mantém o aviso fora do campo de digitação', () => {
    const stylesheet = fs.readFileSync(
      'src/components/Coachmark.module.scss',
      'utf8',
    );

    expect(stylesheet).toMatch(
      /@media \(max-width: 640px\)[\s\S]*\.tooltip\s*\{[\s\S]*top:\s*64px !important[\s\S]*bottom:\s*auto !important/,
    );
  });
});

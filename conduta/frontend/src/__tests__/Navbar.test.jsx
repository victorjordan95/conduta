import fs from 'node:fs';
import { render, screen, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import Navbar from '../components/landing/Navbar';

describe('Navbar da landing page', () => {
  it('mantém apenas o CTA principal no cabeçalho mobile', () => {
    const stylesheet = fs.readFileSync(
      'src/components/landing/Navbar.module.scss',
      'utf8',
    );

    expect(stylesheet).toMatch(
      /@media \(max-width: 640px\)[\s\S]*\.links\s*\{[\s\S]*display:\s*none/,
    );
  });

  it('leva o CTA Começar grátis para o login', () => {
    render(
      <MemoryRouter>
        <Navbar />
      </MemoryRouter>,
    );

    const navigation = within(screen.getByRole('navigation'));
    expect(navigation.getByRole('link', { name: 'Começar grátis' })).toHaveAttribute(
      'href',
      '/login',
    );
  });
});

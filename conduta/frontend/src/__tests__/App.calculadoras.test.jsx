import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import Navbar from '../components/landing/Navbar';

describe('acesso público às calculadoras', () => {
  it('exibe o link de calculadoras na navegação', () => {
    render(
      <MemoryRouter>
        <Navbar />
      </MemoryRouter>,
    );

    expect(screen.getByRole('link', { name: /calculadoras/i })).toHaveAttribute('href', '/calculadoras');
  });
});

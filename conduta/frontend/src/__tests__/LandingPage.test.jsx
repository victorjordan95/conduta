// frontend/src/__tests__/LandingPage.test.jsx
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import LandingPage from '../pages/LandingPage';

function renderLanding() {
  return render(
    <MemoryRouter>
      <LandingPage />
    </MemoryRouter>
  );
}

describe('LandingPage', () => {
  it('renderiza sem erros', () => {
    renderLanding();
    expect(document.body).toBeTruthy();
  });

  it('exibe headline do hero', () => {
    renderLanding();
    expect(screen.getByText(/aquela dúvida clínica/i)).toBeInTheDocument();
  });

  it('exibe link de cadastro no hero', () => {
    renderLanding();
    const links = screen.getAllByRole('link', { name: /começar grátis/i });
    expect(links.length).toBeGreaterThan(0);
    expect(links[0]).toHaveAttribute('href', '/login');
  });
});

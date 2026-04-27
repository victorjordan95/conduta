// frontend/src/__tests__/LandingPage.test.jsx
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
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

  it('exibe os dois planos de preço', () => {
    renderLanding();
    expect(screen.getByText(/gratuito/i)).toBeInTheDocument();
    expect(screen.getByText(/R\$39,90/)).toBeInTheDocument();
  });

  it('FAQ — abre resposta ao clicar na pergunta', async () => {
    renderLanding();
    const pergunta = screen.getByText(/substitui o médico/i);
    expect(screen.queryByText(/ferramenta de apoio à decisão/i)).not.toBeInTheDocument();
    await userEvent.click(pergunta);
    expect(screen.getByText(/ferramenta de apoio à decisão/i)).toBeInTheDocument();
  });
});

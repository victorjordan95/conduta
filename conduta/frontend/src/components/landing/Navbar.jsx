import { Link } from 'react-router-dom';
import navStyles from './Navbar.module.scss';

export default function Navbar() {
  return (
    <nav className={navStyles.nav}>
      <div className={navStyles.inner}>
        <Link to="/" className={navStyles.brand}>
          <span className={navStyles.dot} />
          Conduta
        </Link>
        <div className={navStyles.links}>
          <a href="#precos" className={navStyles.navLink}>Planos</a>
          <a href="#faq" className={navStyles.navLink}>Dúvidas</a>
        </div>
        <div className={navStyles.actions}>
          <Link to="/login" className={navStyles.loginLink}>Entrar</Link>
          <Link to="/register" className={navStyles.ctaBtn}>Começar grátis</Link>
        </div>
      </div>
    </nav>
  );
}

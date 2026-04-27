import { Link } from 'react-router-dom';
import styles from './landing.module.scss';
import navStyles from './Navbar.module.scss';

export default function Navbar() {
  return (
    <nav className={navStyles.nav}>
      <div className={navStyles.inner}>
        <Link to="/" className={navStyles.brand}>
          <span className={navStyles.dot} />
          Conduta
        </Link>
        <div className={navStyles.actions}>
          <Link to="/login" className={navStyles.loginLink}>Entrar</Link>
          <Link to="/login" className={styles.ctaButton} style={{ padding: '8px 20px', fontSize: '13px' }}>
            Começar grátis
          </Link>
        </div>
      </div>
    </nav>
  );
}

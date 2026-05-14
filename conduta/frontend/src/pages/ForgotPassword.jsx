import { useState } from 'react';
import { Link } from 'react-router-dom';
import { forgotPassword } from '../services/api';
import styles from './Login.module.scss';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [enviado, setEnviado] = useState(false);
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState('');

  async function handleSubmit(e) {
    e.preventDefault();
    setErro('');
    setLoading(true);
    try {
      await forgotPassword(email);
      setEnviado(true);
    } catch (err) {
      setErro(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <div className={styles.brand}>
          <h1>Conduta</h1>
          <p>Recuperar senha</p>
        </div>

        {enviado ? (
          <p style={{ color: '#5a6a7a', lineHeight: 1.6, fontSize: '14px', textAlign: 'center' }}>
            Se esse email estiver cadastrado, você receberá as instruções em breve.
          </p>
        ) : (
          <form onSubmit={handleSubmit}>
            <div className={styles.field}>
              <label htmlFor="email">E-mail</label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="medico@exemplo.com"
                required
                autoFocus
              />
            </div>

            <button
              type="submit"
              className={styles.button}
              disabled={loading}
            >
              {loading ? 'Enviando...' : 'Enviar instruções'}
            </button>

            {erro && <p className={styles.error}>{erro}</p>}
          </form>
        )}

        <p style={{ marginTop: '20px', fontSize: '13px', textAlign: 'center', color: '#5a6a7a' }}>
          <Link to="/login" style={{ color: '#1a6b73' }}>Voltar para o login</Link>
        </p>
      </div>
    </div>
  );
}

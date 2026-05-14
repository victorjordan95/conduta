import { useState } from 'react';
import { useLocation, Link } from 'react-router-dom';
import { resendVerification } from '../services/api';
import styles from './Login.module.scss';

export default function VerifyEmailPending() {
  const location = useLocation();
  const email = location.state?.email || '';
  const [enviado, setEnviado] = useState(false);
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState('');

  async function handleReenviar() {
    if (!email || loading) return;
    setErro('');
    setLoading(true);
    try {
      await resendVerification(email);
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
          <p>Verifique seu email</p>
        </div>

        <p style={{ color: '#5a6a7a', lineHeight: 1.6, marginBottom: '20px', fontSize: '14px' }}>
          Enviamos um link de confirmação para <strong>{email || 'seu email'}</strong>.
          Clique no link para ativar sua conta.
        </p>

        {enviado ? (
          <p style={{ color: '#27ae60', fontSize: '14px', textAlign: 'center' }}>
            Email reenviado com sucesso. Verifique sua caixa de entrada.
          </p>
        ) : (
          <button
            className={styles.button}
            onClick={handleReenviar}
            disabled={loading || !email}
          >
            {loading ? 'Enviando...' : 'Reenviar email'}
          </button>
        )}

        {erro && <p className={styles.error}>{erro}</p>}

        <p style={{ marginTop: '20px', fontSize: '13px', textAlign: 'center', color: '#5a6a7a' }}>
          <Link to="/login" style={{ color: '#1a6b73' }}>Voltar para o login</Link>
        </p>
      </div>
    </div>
  );
}

import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { verifyEmail } from '../services/api';
import { useAuth } from '../context/AuthContext';
import styles from './Login.module.scss';

export default function VerifyEmail() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { saveAuth } = useAuth();
  const [status, setStatus] = useState('loading');
  const [erro, setErro] = useState('');

  useEffect(() => {
    const token = searchParams.get('token');
    if (!token) {
      setStatus('error');
      setErro('Link inválido.');
      return;
    }

    verifyEmail(token)
      .then((data) => {
        saveAuth(data.token, data.user);
        navigate('/', { replace: true });
      })
      .catch((err) => {
        setStatus('error');
        setErro(err.message);
      });
  }, []);

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <div className={styles.brand}>
          <h1>Conduta</h1>
          <p>{status === 'loading' ? 'Verificando...' : 'Erro na verificação'}</p>
        </div>

        {status === 'loading' && (
          <p style={{ color: '#5a6a7a', textAlign: 'center', fontSize: '14px' }}>
            Confirmando seu email, aguarde...
          </p>
        )}

        {status === 'error' && (
          <>
            <p className={styles.error}>{erro}</p>
            <p style={{ marginTop: '16px', fontSize: '13px', textAlign: 'center' }}>
              <Link to="/cadastro" style={{ color: '#1a6b73' }}>Criar nova conta</Link>
              {' · '}
              <Link to="/login" style={{ color: '#1a6b73' }}>Entrar</Link>
            </p>
          </>
        )}
      </div>
    </div>
  );
}

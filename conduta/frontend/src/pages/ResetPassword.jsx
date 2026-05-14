import { useState } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { resetPassword } from '../services/api';
import styles from './Login.module.scss';

const REQUISITOS = [
  { id: 'len',   label: 'Mínimo 8 caracteres',  test: (s) => s.length >= 8 },
  { id: 'upper', label: 'Uma letra maiúscula',   test: (s) => /[A-Z]/.test(s) },
  { id: 'num',   label: 'Um número',             test: (s) => /[0-9]/.test(s) },
];

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token') || '';

  const [senha, setSenha] = useState('');
  const [confirmar, setConfirmar] = useState('');
  const [senhaFocada, setSenhaFocada] = useState(false);
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState('');

  const senhaValida = REQUISITOS.every((r) => r.test(senha));
  const coincidem = confirmar.length > 0 && senha === confirmar;

  async function handleSubmit(e) {
    e.preventDefault();
    if (!senhaValida || !coincidem) return;
    setErro('');
    setLoading(true);
    try {
      await resetPassword(token, senha);
      navigate('/login', { state: { resetSuccess: true } });
    } catch (err) {
      setErro(err.message);
    } finally {
      setLoading(false);
    }
  }

  if (!token) {
    return (
      <div className={styles.container}>
        <div className={styles.card}>
          <div className={styles.brand}><h1>Conduta</h1></div>
          <p className={styles.error}>Link inválido.</p>
          <p style={{ marginTop: '16px', fontSize: '13px', textAlign: 'center' }}>
            <Link to="/esqueci-senha" style={{ color: '#1a6b73' }}>Solicitar novo link</Link>
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <div className={styles.brand}>
          <h1>Conduta</h1>
          <p>Nova senha</p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className={styles.field}>
            <label htmlFor="senha">Nova senha</label>
            <input
              id="senha"
              type="password"
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
              onFocus={() => setSenhaFocada(true)}
              placeholder="Mínimo 8 caracteres"
              required
              autoFocus
            />
            {(senhaFocada || senha.length > 0) && (
              <ul style={{ listStyle: 'none', padding: 0, marginTop: '8px' }}>
                {REQUISITOS.map((r) => {
                  const ok = r.test(senha);
                  return (
                    <li key={r.id} style={{ fontSize: '12px', color: ok ? '#27ae60' : '#c0392b' }}>
                      {ok ? '✓' : '✗'} {r.label}
                    </li>
                  );
                })}
              </ul>
            )}
          </div>

          <div className={styles.field}>
            <label htmlFor="confirmar">Confirmar nova senha</label>
            <input
              id="confirmar"
              type="password"
              value={confirmar}
              onChange={(e) => setConfirmar(e.target.value)}
              placeholder="Repita a senha"
              required
            />
            {confirmar.length > 0 && (
              <p style={{ fontSize: '12px', marginTop: '4px', color: coincidem ? '#27ae60' : '#c0392b' }}>
                {coincidem ? '✓ Senhas coincidem' : '✗ Senhas não coincidem'}
              </p>
            )}
          </div>

          <button
            type="submit"
            className={styles.button}
            disabled={loading || !senhaValida || !coincidem}
          >
            {loading ? 'Salvando...' : 'Salvar nova senha'}
          </button>

          {erro && <p className={styles.error}>{erro}</p>}
        </form>
      </div>
    </div>
  );
}

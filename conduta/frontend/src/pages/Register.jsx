import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { register } from '../services/api';
import styles from './Register.module.scss';

function EyeIcon({ visible }) {
  if (visible) {
    return (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
        <circle cx="12" cy="12" r="3" />
      </svg>
    );
  }
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
      <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
      <line x1="1" y1="1" x2="23" y2="23" />
    </svg>
  );
}

const REQUISITOS = [
  { id: 'len',   label: 'Mínimo 8 caracteres',      test: (s) => s.length >= 8 },
  { id: 'upper', label: 'Uma letra maiúscula',        test: (s) => /[A-Z]/.test(s) },
  { id: 'num',   label: 'Um número',                  test: (s) => /[0-9]/.test(s) },
];

export default function Register() {
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [confirmar, setConfirmar] = useState('');
  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [mostrarConfirmar, setMostrarConfirmar] = useState(false);
  const [senhaFocada, setSenhaFocada] = useState(false);
  const [erro, setErro] = useState('');
  const [loading, setLoading] = useState(false);
  const { saveAuth } = useAuth();
  const navigate = useNavigate();

  const senhaValida = REQUISITOS.every((r) => r.test(senha));
  const coincidem = confirmar.length > 0 && senha === confirmar;
  const naoCoincide = confirmar.length > 0 && senha !== confirmar;

  async function handleSubmit(e) {
    e.preventDefault();
    setErro('');

    if (!senhaValida) {
      setErro('A senha não atende aos requisitos.');
      return;
    }
    if (!coincidem) {
      setErro('As senhas não coincidem.');
      return;
    }

    setLoading(true);
    try {
      const data = await register(nome, email, senha);
      saveAuth(data.token, data.user);
      navigate('/');
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
          <p>Crie sua conta gratuita</p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className={styles.field}>
            <label htmlFor="nome">Nome</label>
            <input
              id="nome"
              type="text"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              placeholder="Seu nome completo"
              required
              autoFocus
            />
          </div>

          <div className={styles.field}>
            <label htmlFor="email">E-mail</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="medico@exemplo.com"
              required
            />
          </div>

          <div className={styles.field}>
            <label htmlFor="senha">Senha</label>
            <div className={styles.passwordWrapper}>
              <input
                id="senha"
                type={mostrarSenha ? 'text' : 'password'}
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
                onFocus={() => setSenhaFocada(true)}
                placeholder="Mínimo 8 caracteres"
                required
              />
              <button
                type="button"
                className={styles.eyeButton}
                onClick={() => setMostrarSenha((v) => !v)}
                aria-label={mostrarSenha ? 'Ocultar senha' : 'Mostrar senha'}
              >
                <EyeIcon visible={mostrarSenha} />
              </button>
            </div>

            {(senhaFocada || senha.length > 0) && (
              <ul className={styles.requisitos}>
                {REQUISITOS.map((r) => {
                  const ok = r.test(senha);
                  return (
                    <li key={r.id} className={ok ? styles.reqOk : styles.reqFail}>
                      {ok ? '✓' : '✗'} {r.label}
                    </li>
                  );
                })}
              </ul>
            )}
          </div>

          <div className={styles.field}>
            <label htmlFor="confirmar">Confirmar senha</label>
            <div className={styles.passwordWrapper}>
              <input
                id="confirmar"
                type={mostrarConfirmar ? 'text' : 'password'}
                value={confirmar}
                onChange={(e) => setConfirmar(e.target.value)}
                placeholder="Repita a senha"
                required
              />
              <button
                type="button"
                className={styles.eyeButton}
                onClick={() => setMostrarConfirmar((v) => !v)}
                aria-label={mostrarConfirmar ? 'Ocultar senha' : 'Mostrar senha'}
              >
                <EyeIcon visible={mostrarConfirmar} />
              </button>
            </div>

            {confirmar.length > 0 && (
              <p className={coincidem ? styles.matchOk : styles.matchFail}>
                {coincidem ? '✓ Senhas coincidem' : '✗ Senhas não coincidem'}
              </p>
            )}
          </div>

          <button
            type="submit"
            className={styles.button}
            disabled={loading}
          >
            {loading ? 'Criando conta...' : 'Criar conta grátis'}
          </button>

          {erro && <p className={styles.error}>{erro}</p>}
        </form>

        <p className={styles.loginLink}>
          Já tem conta?{' '}
          <Link to="/login">Entrar</Link>
        </p>
      </div>
    </div>
  );
}

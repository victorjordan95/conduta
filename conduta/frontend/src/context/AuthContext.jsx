import { createContext, useContext, useEffect, useState } from 'react';
import { getMe } from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem('conduta_token'));
  const [user, setUser] = useState(() => {
    const stored = localStorage.getItem('conduta_user');
    return stored ? JSON.parse(stored) : null;
  });
  const [kickMessage, setKickMessage] = useState(null);

  function saveAuth(newToken, newUser) {
    localStorage.setItem('conduta_token', newToken);
    localStorage.setItem('conduta_user', JSON.stringify(newUser));
    setToken(newToken);
    setUser(newUser);
    setKickMessage(null);
  }

  function clearAuth() {
    localStorage.removeItem('conduta_token');
    localStorage.removeItem('conduta_user');
    setToken(null);
    setUser(null);
  }

  async function refreshUser() {
    if (!token) return;
    try {
      const data = await getMe();
      const updatedUser = { ...user, ...data };
      localStorage.setItem('conduta_user', JSON.stringify(updatedUser));
      setUser(updatedUser);
    } catch (err) {
      console.warn('[AuthContext] refreshUser falhou:', err.message);
    }
  }

  useEffect(() => {
    const handleUnauthorized = (e) => {
      setKickMessage(e.detail?.message || null);
      clearAuth();
    };
    const handleEmailNotVerified = () => {
      window.location.href = '/verify-pending';
    };
    window.addEventListener('conduta:unauthorized', handleUnauthorized);
    window.addEventListener('conduta:email-not-verified', handleEmailNotVerified);
    return () => {
      window.removeEventListener('conduta:unauthorized', handleUnauthorized);
      window.removeEventListener('conduta:email-not-verified', handleEmailNotVerified);
    };
  }, []);

  return (
    <AuthContext.Provider value={{ token, user, kickMessage, saveAuth, clearAuth, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}

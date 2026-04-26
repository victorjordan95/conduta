import { createContext, useContext, useEffect, useState } from 'react';

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

  useEffect(() => {
    const handler = (e) => {
      setKickMessage(e.detail?.message || null);
      clearAuth();
    };
    window.addEventListener('conduta:unauthorized', handler);
    return () => window.removeEventListener('conduta:unauthorized', handler);
  }, []);

  return (
    <AuthContext.Provider value={{ token, user, kickMessage, saveAuth, clearAuth }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}

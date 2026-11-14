import { createContext, useContext, useMemo, useState } from 'react';
import api from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const stored = localStorage.getItem('eai_user');
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });

  const login = async (email, password) => {
    const { data } = await api.post('/auth/login', { email, password });
    localStorage.setItem('eai_token', data.access_token);
    localStorage.setItem('eai_user', JSON.stringify(data.user));
    localStorage.setItem('eai_role', data.user.role);
    setUser(data.user);
    return data.user;
  };

  const logout = () => {
    ['eai_token', 'eai_user', 'eai_role'].forEach((k) => localStorage.removeItem(k));
    setUser(null);
  };

  const value = useMemo(() => ({ user, login, logout }), [user]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);

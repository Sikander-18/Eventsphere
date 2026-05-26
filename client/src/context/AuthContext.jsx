import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import api from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const raw = localStorage.getItem('eventsphere_user');
    return raw ? JSON.parse(raw) : null;
  });
  const [token, setToken] = useState(() => localStorage.getItem('eventsphere_token'));
  const [loading, setLoading] = useState(Boolean(token));

  useEffect(() => {
    const hydrate = async () => {
      if (!token) {
        setLoading(false);
        return;
      }
      try {
        const { data } = await api.get('/auth/me');
        const normalized = {
          id: data._id,
          name: data.name,
          email: data.email,
          role: data.role,
          linkedinUrl: data.linkedinUrl
        };
        setUser(normalized);
        localStorage.setItem('eventsphere_user', JSON.stringify(normalized));
      } catch {
        localStorage.removeItem('eventsphere_token');
        localStorage.removeItem('eventsphere_user');
        setToken(null);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };
    hydrate();
  }, [token]);

  const login = async (email, password) => {
    const { data } = await api.post('/auth/login', { email, password });
    localStorage.setItem('eventsphere_token', data.token);
    localStorage.setItem('eventsphere_user', JSON.stringify(data.user));
    setToken(data.token);
    setUser(data.user);
    return data.user;
  };

  const register = async (payload) => {
    const { data } = await api.post('/auth/register', payload);
    localStorage.setItem('eventsphere_token', data.token);
    localStorage.setItem('eventsphere_user', JSON.stringify(data.user));
    setToken(data.token);
    setUser(data.user);
    return data.user;
  };

  const logout = () => {
    localStorage.removeItem('eventsphere_token');
    localStorage.removeItem('eventsphere_user');
    setToken(null);
    setUser(null);
  };

  const value = useMemo(() => ({ user, token, loading, login, register, logout }), [user, token, loading]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => useContext(AuthContext);


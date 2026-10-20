import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../api/axiosInstance';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    try {
      const stored = localStorage.getItem('unfazed_user');
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });

  const [token, setToken] = useState(() => localStorage.getItem('unfazed_token') || null);
  const [role, setRole] = useState(() => localStorage.getItem('unfazed_role') || null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      const storedToken = localStorage.getItem('unfazed_token');
      const storedRole = localStorage.getItem('unfazed_role');

      if (storedToken && storedRole === 'therapist') {
        try {
          const res = await api.get('/auth/me');
          if (res.data?.success && res.data?.therapist) {
            setUser(res.data.therapist);
            localStorage.setItem('unfazed_user', JSON.stringify(res.data.therapist));
          }
        } catch (err) {
          console.warn('Session expired or invalid, logging out', err);
          logout();
        }
      }
      setLoading(false);
    };

    initAuth();
  }, []);

  const loginTherapist = async (email, password) => {
    try {
      const res = await api.post('/auth/login', { email, password });
      if (res.data?.success) {
        const { token, therapist } = res.data;
        localStorage.setItem('unfazed_token', token);
        localStorage.setItem('unfazed_user', JSON.stringify(therapist));
        localStorage.setItem('unfazed_role', 'therapist');
        setToken(token);
        setUser(therapist);
        setRole('therapist');
        return therapist;
      }
      throw new Error(res.data?.error || 'Login failed');
    } catch (err) {
      const msg = err.response?.data?.error || err.message || 'Invalid email or password';
      throw new Error(msg);
    }
  };

  const registerTherapist = async (formData) => {
    try {
      const res = await api.post('/auth/register', formData);
      if (res.data?.success) {
        const { token, therapist } = res.data;
        localStorage.setItem('unfazed_token', token);
        localStorage.setItem('unfazed_user', JSON.stringify(therapist));
        localStorage.setItem('unfazed_role', 'therapist');
        setToken(token);
        setUser(therapist);
        setRole('therapist');
        return therapist;
      }
      throw new Error(res.data?.error || 'Registration failed');
    } catch (err) {
      const msg = err.response?.data?.error || err.message || 'Registration failed';
      throw new Error(msg);
    }
  };

  const loginClient = async (email, therapistSlug) => {
    try {
      const res = await api.post('/auth/client-login', { email, therapistSlug });
      if (res.data?.success) {
        const { token, client } = res.data;
        localStorage.setItem('unfazed_token', token);
        localStorage.setItem('unfazed_user', JSON.stringify(client));
        localStorage.setItem('unfazed_role', 'client');
        setToken(token);
        setUser(client);
        setRole('client');
        return client;
      }
      throw new Error(res.data?.error || 'Client lookup failed');
    } catch (err) {
      const msg = err.response?.data?.error || err.message || 'Client lookup failed';
      throw new Error(msg);
    }
  };

  const logout = () => {
    localStorage.removeItem('unfazed_token');
    localStorage.removeItem('unfazed_user');
    localStorage.removeItem('unfazed_role');
    setToken(null);
    setUser(null);
    setRole(null);
  };

  const updateUserProfile = (updatedData) => {
    setUser((prev) => {
      const updated = { ...prev, ...updatedData };
      localStorage.setItem('unfazed_user', JSON.stringify(updated));
      return updated;
    });
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        role,
        loading,
        isAuthenticated: Boolean(token && user),
        isTherapist: role === 'therapist',
        isClient: role === 'client',
        loginTherapist,
        registerTherapist,
        loginClient,
        logout,
        updateUserProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);

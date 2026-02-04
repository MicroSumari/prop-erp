import React, { createContext, useState, useContext, useEffect } from 'react';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if user is already logged in
    const token = localStorage.getItem('authToken');
    const username = localStorage.getItem('username');
    
    if (token && username) {
      setIsAuthenticated(true);
      setUser({ username });
    }
    
    setLoading(false);
  }, []);

  const login = (token, username) => {
    localStorage.setItem('authToken', token);
    localStorage.setItem('username', username);
    setIsAuthenticated(true);
    setUser({ username });
  };

  const logout = () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('username');
    setIsAuthenticated(false);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

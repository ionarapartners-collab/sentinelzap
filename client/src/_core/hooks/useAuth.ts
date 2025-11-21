import { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext<any>(null);

export function AuthProvider({ children }: { children: any }) {
  const [user, setUser] = useState({ id: '1', name: 'Usuário Demo' });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    localStorage.setItem('auth_token', 'demo-token');
  }, []);

  const login = async () => {
    setUser({ id: '1', name: 'Usuário Demo' });
  };

  const logout = () => {
    setUser(null);
  };

  const value = {
    user,
    loading,
    isAuthenticated: !!user,
    login,
    logout
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}

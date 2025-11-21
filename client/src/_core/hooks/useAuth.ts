import { useState, useEffect, createContext, useContext } from 'react';

interface User {
  id: string;
  name: string;
  email: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// ✅ USUÁRIO FIXO PARA DESENVOLVIMENTO (SEM BANCO)
const MOCK_USER: User = {
  id: '1',
  name: 'Usuário Demo',
  email: 'demo@sentinelzap.com'
};

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // ✅ HOTFIX: Auto-login para desenvolvimento
    const initializeAuth = async () => {
      try {
        // Simular verificação de token (sem banco)
        const token = localStorage.getItem('auth_token');
        
        if (token) {
          setUser(MOCK_USER);
        } else {
          // Auto-login em desenvolvimento
          localStorage.setItem('auth_token', 'demo-token');
          setUser(MOCK_USER);
        }
      } catch (error) {
        console.warn('Auth initialization failed, using demo mode:', error);
        // Fallback: auto-login sempre
        localStorage.setItem('auth_token', 'demo-token');
        setUser(MOCK_USER);
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();
  }, []);

  const login = async (email: string, password: string) => {
    // ✅ HOTFIX: Login automático sem validação
    localStorage.setItem('auth_token', 'demo-token');
    setUser(MOCK_USER);
  };

  const logout = () => {
    localStorage.removeItem('auth_token');
    setUser(null);
  };

  const value = {
    user,
    loading,
    isAuthenticated: !!user,
    login,
    logout,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { api, getToken, setToken } from '@/lib/api';

interface AuthUser {
  id: string;
  email: string;
}

interface AuthContextValue {
  session: { user: AuthUser } | null;
  user: AuthUser | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signUp: (email: string, password: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  // On mount, if a token is stored, validate it against the API and restore
  // the session. This replaces supabase.auth.getSession().
  useEffect(() => {
    const token = getToken();
    if (!token) {
      setLoading(false);
      return;
    }

    api
      .get<{ user: AuthUser }>('/api/auth/me')
      .then(({ user: me }) => setUser(me))
      .catch(() => setToken(null))
      .finally(() => setLoading(false));
  }, []);

  const signIn = async (email: string, password: string) => {
    try {
      const { token, user: loggedInUser } = await api.post<{ token: string; user: AuthUser }>(
        '/api/auth/login',
        { email, password }
      );
      setToken(token);
      setUser(loggedInUser);
      return { error: null };
    } catch (err) {
      return { error: err instanceof Error ? err.message : 'Sign in failed.' };
    }
  };

  const signUp = async (email: string, password: string) => {
    try {
      const { token, user: newUser } = await api.post<{ token: string; user: AuthUser }>(
        '/api/auth/signup',
        { email, password }
      );
      setToken(token);
      setUser(newUser);
      return { error: null };
    } catch (err) {
      return { error: err instanceof Error ? err.message : 'Sign up failed.' };
    }
  };

  const signOut = async () => {
    try {
      await api.post('/api/auth/logout');
    } catch {
      // best-effort; still clear the local session either way
    }
    setToken(null);
    setUser(null);
  };

  const session = user ? { user } : null;

  return (
    <AuthContext.Provider value={{ session, user, loading, signIn, signUp, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}

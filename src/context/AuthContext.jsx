import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { api, getToken, setToken } from '../api/client';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setTokenState] = useState(getToken());
  const [loading, setLoading] = useState(Boolean(getToken()));

  // On first load, if a token exists, hydrate the user from the API.
  useEffect(() => {
    let active = true;
    async function hydrate() {
      if (!token) {
        setLoading(false);
        return;
      }
      try {
        const data = await api.profile();
        if (active) setUser(data.user);
      } catch {
        // Token invalid/expired — clear it.
        if (active) {
          setToken(null);
          setTokenState(null);
        }
      } finally {
        if (active) setLoading(false);
      }
    }
    hydrate();
    return () => {
      active = false;
    };
  }, [token]);

  async function login(credentials) {
    const data = await api.login(credentials);
    setToken(data.token);
    setTokenState(data.token);
    setUser(data.user);
    return data.user;
  }

  async function register(payload) {
    const data = await api.register(payload);
    setToken(data.token);
    setTokenState(data.token);
    setUser(data.user);
    return data.user;
  }

  // Ends the local session immediately and retires the token server-side in the
  // background. The order is load-bearing: `request` reads the stored token and
  // builds its Authorization header synchronously, so the revocation below is
  // issued before the state updates that clear it.
  //
  // Clearing first would send the call unauthenticated and get a 401, and
  // awaiting first would hold the user on the page for a round trip they did
  // not ask to wait for. A failed revocation is swallowed deliberately: the user
  // asked to log out, and refusing to because the network is down would strand
  // them in a session they have already decided to end. The token then stays
  // valid until it expires, which is the same exposure as any other failed
  // revocation.
  async function logout() {
    const revoked = api.logout().catch(() => {});
    setToken(null);
    setTokenState(null);
    setUser(null);
    await revoked;
  }

  const value = useMemo(
    () => ({ user, token, loading, isAuthenticated: Boolean(token), login, register, logout }),
    [user, token, loading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
}

export default AuthContext;

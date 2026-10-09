import { createContext, useContext, useEffect, useState, useCallback } from "react";
import axiosInstance from "../api/axiosInstance";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    axiosInstance.get("/auth/me")
      .then(({ data }) => { if (!cancelled) setUser(data.user); })
      .catch(() => { if (!cancelled) setUser(null); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [1]);

  const login = useCallback((userData) => setUser(userData), []);

  const logout = useCallback(async () => {
    try { await axiosInstance.post("/auth/logout"); } catch {}
    setUser(null);
  }, []);

  useEffect(() => {
    const onForcedLogout = () => setUser(null);
    window.addEventListener("auth:logout", onForcedLogout);
    return () => window.removeEventListener("auth:logout", onForcedLogout);
  }, []);

  // useEffect(() => {
  //   console.log({ user, loading }); // debug only, remove later
  // }, [user, loading]);

  return (
    <AuthContext.Provider value={{ user, loading, isAuthenticated: !!user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
import { createContext, useContext, useEffect, useState,useCallback } from "react";
import {
  getAccessToken,
  getUser,
  saveTokens,
  saveUser,
  clearSession,
} from "../api/tokenStorage";

const AuthContext = createContext(null)

export function AuthProvider({children}){
    const [user, setUser] = useState(()=> getUser())
    const [isAuthenticated, setIsAuthenticated] = useState(() => !!getAccessToken());
    // console.log(isAuthenticated)
    
  const login = ({ accessToken, refreshToken, user: userData }) => {
    saveTokens({ accessToken, refreshToken });
    saveUser(userData);
    setUser(userData);
    setIsAuthenticated(true);
  };

  const logout = useCallback(() => {
    clearSession();
    setUser(null);
    setIsAuthenticated(false);
  }, []);

 useEffect(() => {
    window.addEventListener("auth:logout", logout);
    return () => window.removeEventListener("auth:logout", logout);
  }, [logout]);
      
  return (
    <AuthContext.Provider value={{ user, login, logout, isAuthenticated }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
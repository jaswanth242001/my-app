import { createContext, useContext, useState, useCallback, useEffect } from "react";
import { api, setUnauthorizedHandler } from "../api/client";

const AuthContext = createContext(null);
const TOKEN_STORAGE_KEY = "noteflow:auth-token";

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem(TOKEN_STORAGE_KEY));
  const [user, setUser] = useState(null);

  const login = useCallback(async (email, password) => {
    const data = await api.post("/Auth/login", { email, password });
    const nextToken = data?.token ?? null;
    setToken(nextToken);
    setUser(data?.user ?? null);
    if (nextToken) {
      localStorage.setItem(TOKEN_STORAGE_KEY, nextToken);
    } else {
      localStorage.removeItem(TOKEN_STORAGE_KEY);
    }
    return data;
  }, []);

  const register = useCallback((payload) => {
    return api.post("/Auth/register", payload);
  }, []);

  const resetPassword = useCallback((email, newPassword) => {
    return api.post("/Auth/reset-password", { email, newPassword });
  }, []);

  const fetchProfile = useCallback(async () => {
    const data = await api.get("/Auth/profile", token);
    setUser(data);
    return data;
  }, [token]);

  const logout = useCallback(async () => {
    try {
      await api.post("/Auth/logout", undefined, token);
    } catch {
      // Ignore network errors during logout; clear local state regardless.
    } finally {
      setToken(null);
      setUser(null);
      localStorage.removeItem(TOKEN_STORAGE_KEY);
    }
  }, [token]);

  // Let the API client force a logout whenever a request comes back 401
  // (expired/invalid session), without creating an import cycle.
  useEffect(() => {
    setUnauthorizedHandler(() => {
      setToken(null);
      setUser(null);
      localStorage.removeItem(TOKEN_STORAGE_KEY);
    });
    return () => setUnauthorizedHandler(null);
  }, []);

  return (
    <AuthContext.Provider
      value={{
        token,
        user,
        login,
        register,
        resetPassword,
        fetchProfile,
        logout,
        isAuthenticated: !!token,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

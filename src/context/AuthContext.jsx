import { createContext, useContext, useState, useCallback } from "react";
import { api } from "../api/client";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [token, setToken] = useState(null);
  const [user, setUser] = useState(null);

  const login = useCallback(async (email, password) => {
    const data = await api.post("/Auth/login", { email, password });
    setToken(data?.token ?? null);
    setUser(data?.user ?? null);
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
    }
  }, [token]);

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

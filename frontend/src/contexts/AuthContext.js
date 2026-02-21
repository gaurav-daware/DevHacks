import { createContext, useContext, useState, useEffect } from "react";
import api from "@/services/api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("codearena_token");
    if (token) {
      api.get("/auth/me")
        .then(res => setUser(res.data))
        .catch(() => {
          localStorage.removeItem("codearena_token");
          setUser(null);
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const login = async (email, password) => {
    const res = await api.post("/auth/login", { email, password });
    const { token, user: userData } = res.data;
    localStorage.setItem("codearena_token", token);
    setUser(userData);
    return userData;
  };

  const register = async (username, email, password) => {
    const res = await api.post("/auth/register", { username, email, password });
    const { token, user: userData } = res.data;
    localStorage.setItem("codearena_token", token);
    setUser(userData);
    return userData;
  };

  const logout = () => {
    localStorage.removeItem("codearena_token");
    setUser(null);
  };

  const refreshUser = async () => {
    try {
      const res = await api.get("/auth/me");
      setUser(res.data);
    } catch (e) {
      // Ignore
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}

export default AuthContext;

"use client";

import { createContext, useContext, useState, useEffect } from "react";
import axios from "axios";

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [role, setRole] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check local storage on boot
    const token = localStorage.getItem("token");
    const storedRole = localStorage.getItem("role");
    const storedName = localStorage.getItem("fullName");
    const storedEmail = localStorage.getItem("email");
    const storedCell = localStorage.getItem("cellNumber");
    const storedRank = localStorage.getItem("rankName");

    if (token) {
      setUser({
        token,
        fullName: storedName,
        email: storedEmail,
        cellNumber: storedCell,
        rankName: storedRank,
      });
      setRole(storedRole);
    }
    setLoading(false);
  }, []);

  const login = async (email, password) => {
    setLoading(true);
    try {
      const res = await axios.post("/api/auth/login", { email, password });
      const { token, role: userRole, fullName, cellNumber, rankName } = res.data;

      localStorage.setItem("token", token);
      localStorage.setItem("role", userRole);
      localStorage.setItem("fullName", fullName);
      localStorage.setItem("email", email);
      localStorage.setItem("cellNumber", cellNumber || "");
      localStorage.setItem("rankName", rankName || "");

      setUser({ token, fullName, email, cellNumber, rankName });
      setRole(userRole);
      setLoading(false);
      return { success: true, role: userRole };
    } catch (err) {
      setLoading(false);
      const errMsg = err.response?.data?.error || "Login failed";
      throw new Error(errMsg);
    }
  };

  const register = async (userData) => {
    setLoading(true);
    try {
      const res = await axios.post("/api/auth/register", userData);
      const { token, role: userRole, fullName, email, cellNumber, rankName } = res.data;

      localStorage.setItem("token", token);
      localStorage.setItem("role", userRole);
      localStorage.setItem("fullName", fullName);
      localStorage.setItem("email", email);
      localStorage.setItem("cellNumber", cellNumber || "");
      localStorage.setItem("rankName", rankName || "");

      setUser({ token, fullName, email, cellNumber, rankName });
      setRole(userRole);
      setLoading(false);
      return { success: true, role: userRole };
    } catch (err) {
      setLoading(false);
      const errMsg = err.response?.data?.error || "Registration failed";
      throw new Error(errMsg);
    }
  };

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("role");
    localStorage.removeItem("fullName");
    localStorage.removeItem("email");
    localStorage.removeItem("cellNumber");
    localStorage.removeItem("rankName");
    setUser(null);
    setRole(null);
  };

  const value = {
    user,
    role,
    loading,
    login,
    register,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

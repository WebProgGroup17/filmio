import { createContext, useContext, useState } from "react";

const AuthContext = createContext(null);

const API_URL = import.meta.env.VITE_API_URL;

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [accessToken, setAccessToken] = useState(null);

  // Login
  const login = async (email, password) => {
    const res = await fetch(`${API_URL}/users/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        user: {
          email,
          password,
        },
      }),
    });

    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.error || "Login failed");
    }

    const data = await res.json();

    setUser({
      id: data.id,
      email: data.email,
    });

    setAccessToken(data.token);

    return data;
  };

  // Logout
  const logout = async () => {
    if (accessToken) {
      await fetch(`${API_URL}/users/logout`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });
    }

    setUser(null);
    setAccessToken(null);
  };

  // Delete account
  const deleteAccount = async () => {
    const res = await fetch(`${API_URL}/users/me`, {
      method: "DELETE",
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
  });

    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.error?.message || "Failed to delete account");
    }

    setUser(null);
    setAccessToken(null);
  };

  const value = {
    user,
    accessToken,
    login,
    logout,
    deleteAccount,
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


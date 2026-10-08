import { createContext, useContext, useState, useEffect, useRef } from "react";

const AuthContext = createContext(null);

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3001";

const REFRESH_TIME = 4 * 60 * 1000; //4mins
const IDLE_TIME = 10 * 60 * 1000;   //10mins

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [accessToken, setAccessToken] = useState(null);
  //wait for the server response before showing the app
  //when the response is received, loading becomes false
  const [loading, setLoading] = useState(true); 
  //React may run useEffect twice in development mode to detect potential problems
  //this can cause the token to be refreshed twice, so we need to prevent that
  const started = useRef(false); 

  //remember user and token
  const saveSession = (data) => {
    setAccessToken(data.token);
    setUser({ id: data.id, email: data.email });
  };

  //delete user and token
  const clearSession = () => {
    setAccessToken(null);
    setUser(null);
  };

  //ask backend to refresh the session
  const refreshSession = async () => {
    try {
      const res = await fetch(`${API_URL}/users/refresh`, {
        method: "POST",
        credentials: "include", //send the refresh token from the cookie
      });
      if (!res.ok) {
        clearSession(); //clear the session -> user null, accessToken null
        return;
      }
      const data = await res.json();
      saveSession(data);
    } catch (error) {
      console.error("Refresh failed:", error);
    }
  };

  useEffect(() => {
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');

    
    if (token && userData) {
      setAccessToken(token);
      setUser(JSON.parse(userData));
    }
  }, []);

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
      throw new Error(error.error?.message || "Login failed");
    }

    const data = await res.json();

    setUser({
      id: data.id,
      email: data.email,
    });

    setAccessToken(data.token);
    // Save the authentication token to localStorage
    localStorage.setItem('token', data.token);
    localStorage.setItem('user', JSON.stringify({ id: data.id, email: data.email}));

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
    // Remove the authentication token from localStorage
    localStorage.removeItem('token');
    localStorage.removeItem('user');
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
    localStorage.removeItem("token");
    localStorage.removeItem("user");
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


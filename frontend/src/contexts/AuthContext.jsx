import { createContext, useContext, useState, useEffect, useRef } from "react";

const AuthContext = createContext(null);

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3001";
// refresh session every 4 mins
const REFRESH_TIME = 4 * 60 * 1000;
// log out after 10 mins of inactivity
const IDLE_TIME = 10 * 60 * 1000;

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [accessToken, setAccessToken] = useState(null);
  // wait for the session check before showing the app
  const [loading, setLoading] = useState(true);
  // prevent the initial refresh from running twice
  const started = useRef(false);
  // the inactivity timer
  const idleTimer = useRef(null);


  // remember user and access token
  const saveSession = (data) => {
    setAccessToken(data.token ?? null);
    setUser({ id: data.id, email: data.email });
  };

  // clear user and access token
  const clearSession = () => {
    setAccessToken(null);
    setUser(null);
  };

  // ask the backend to refresh the session using the refresh token from the cookie
  const refreshSession = async () => {
    try {
      const res = await fetch(`${API_URL}/users/refresh`, {
        method: "POST",
        credentials: "include",
      });

      if (!res.ok) {
        // clear the session if the refresh token is no longer valid
        clearSession();
        return;
      }

      const data = await res.json();
      // save the new user data and access token
      saveSession(data);
    } catch (error) {
      console.error("Refresh failed:", error);
    }
  };

  useEffect(() => {
    // prevent the refresh from running twice
    if (started.current) return;
    started.current = true;

    // remove old authentication data from local storage
    localStorage.removeItem("token");
    localStorage.removeItem("user");

    // check the user's session when the app starts
    refreshSession().finally(() => setLoading(false));
  }, []);

  // login
  const login = async (email, password) => {
    const res = await fetch(`${API_URL}/users/login`, {
      method: "POST",
      credentials: "include",
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
    // save the user data and access token after login
    saveSession(data);
    return data;
  };
// logout
  const logout = async () => {
    try {
      await fetch(`${API_URL}/users/logout`, {
        method: "POST",
        credentials: "include",
      });
    } catch (error) {
      console.error("Logout failed:", error);
    }
    // clear the session after logout
    clearSession();
  };
// delete
  const deleteAccount = async () => {
    if (!accessToken) {
      throw new Error("No active session");
    }

    const res = await fetch(`${API_URL}/users/me`, {
      method: "DELETE",
      credentials: "include",
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.error?.message || "Failed to delete account");
    }
    // clear the session after deleting the account
    clearSession();
  };

  // check if the user is logged in
  const loggedIn = Boolean(user);

  useEffect(() => {
    if (!loggedIn) return;

    // refresh the session while the user is logged in
    const id = setInterval(() => {
      refreshSession();
    }, REFRESH_TIME);
    // stop the refresh timer when the user logs out
    return () => clearInterval(id);
  }, [loggedIn]);

  useEffect(() => {
    if (!loggedIn) return;

    // track user activity
    const events = ["click", "keydown", "mousemove", "scroll"];

    const resetTimer = () => {
      // reset the inactivity timer
      clearTimeout(idleTimer.current);
      // log out the user after the inactivity time is reached
      idleTimer.current = setTimeout(() => {
        logout();
      }, IDLE_TIME);
    };
    
    // reset the timer when the user interacts with the page
    events.forEach((event) => window.addEventListener(event, resetTimer));
    resetTimer();

    return () => {
      // clear the timer when the effect is cleaned up
      clearTimeout(idleTimer.current);
      // remove event listeners
      events.forEach((event) => window.removeEventListener(event, resetTimer));
    };
  }, [loggedIn]);

  const value = { user, accessToken, loading, login, logout, deleteAccount };

  return (
    //provide authentication data to all child components
    //show the app only after checking the user's session
    <AuthContext.Provider value={value}>
      {loading ? null : children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}

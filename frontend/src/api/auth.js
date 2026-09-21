const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3001";

// signup
export async function signup({ username, email, password }) {
  const response = await fetch(`${API_URL}/users/signup`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ user: { username, email, password } }),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error?.message || `Server responded with ${response.status}`);
  }

  return data;
}

// login
export async function login({ email, password }) {
  const response = await fetch(`${API_URL}/users/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ user: { email, password } }),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error?.message || `Server responded with ${response.status}`);
  }

  return data;
}

// logout
export async function logout(token) {
  const response = await fetch(`${API_URL}/users/logout`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error?.message || `Server responded with ${response.status}`);
  }

  return data;
}

// delete
export async function deleteAccount(token) {
  const response = await fetch(`${API_URL}/users/me`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` },
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error?.message || `Server responded with ${response.status}`);
  }

  return data;
}

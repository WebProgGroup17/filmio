const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3001";

//add a movie to favorites =POST
export async function addFavorite(tmdbMovieId, token) {
  const response = await fetch(`${API_URL}/favorites`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ tmdbMovieId }),
  });

  return response.json();
}

//get current user's favorite movies
export async function getFavorites(token) {
  const response = await fetch(`${API_URL}/favorites`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  return response.json();
}

//remove a movie from favorites
export async function removeFavorite(tmdbMovieId, token) {
  const response = await fetch(`${API_URL}/favorites/${tmdbMovieId}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` },
  });

  return response.json();
}
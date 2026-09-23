const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3001";

//add a movie to favourites =POST
export async function addFavourite(tmdbMovieId, token) {
  const response = await fetch(`${API_URL}/favourites`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ tmdbMovieId }),
  });

  return response.json();
}

//get current user's favourite movies
export async function getFavourites(token) {
  const response = await fetch(`${API_URL}/favourites`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  return response.json();
}

//remove a movie from favourites
export async function removeFavourite(tmdbMovieId, token) {
  const response = await fetch(`${API_URL}/favourites/${tmdbMovieId}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` },
  });

  return response.json();
}
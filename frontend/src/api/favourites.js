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
// create a share link for the user's favourites
export async function createFavouriteShare(token) {
  const response = await fetch(`${API_URL}/favourites/share`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  return response.json();
}
// Get favourite movies from a shared link
export async function getSharedFavourites(shareToken) {
  const response = await fetch(
    `${API_URL}/favourites/share/${shareToken}`
  );

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
const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3001";

//now in cinemas
export async function getNowInCinemas() {
  try {
    const response = await fetch(`${API_URL}/movies/now-playing`);

    if (!response.ok) {
      throw new Error(`Server responded with ${response.status}`);
    }

    const data = await response.json();
    return data;

  } catch (error) {
    console.error("Failed to load now-in-cinemas movies:", error);
    return [];
  }
}

// search movies
export async function searchMovies({ title, genre, year }) {
  try {
    const params = new URLSearchParams();

    if (title) {
      params.append("title", title);
    }

    if (genre) {
      params.append("genre", genre);
    }

    if (year) {
      params.append("year", year);
    }

    const response = await fetch(
      `${API_URL}/movies/search?${params.toString()}`
    );

    if (!response.ok) {
      throw new Error(`Server responded with ${response.status}`);
    }

    const data = await response.json();
    return data;

  } catch (error) {
    console.error("Failed to search movies:", error);
    return [];
  }
}
const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

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
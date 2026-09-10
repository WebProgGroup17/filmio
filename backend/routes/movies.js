import express from 'express'

const router = express.Router()

const TMDB_BASE_URL = 'https://api.themoviedb.org/3'
const TMDB_IMAGE_BASE = 'https://image.tmdb.org/t/p/w500'

router.get('/now-playing', async (req, res) => {
  try {
    const response = await fetch(
      `${TMDB_BASE_URL}/movie/now_playing?region=FI`,
      {
        headers: {
          Authorization: `Bearer ${process.env.TMDB_API_KEY}`,
          accept: 'application/json',
        },
      }
    )

    if (!response.ok) {
      throw new Error(`TMDB responded with ${response.status}`)
    }

    const data = await response.json()

    const movies = data.results.slice(0, 5).map((movie) => ({
      id: movie.id,
      title: movie.title,
      posterUrl: movie.poster_path
        ? `${TMDB_IMAGE_BASE}${movie.poster_path}`
        : null,
    }))

    res.json(movies)
  } catch (error) {
    console.error('Failed to fetch now-playing movies:', error)
    res.status(500).json({ error: 'Failed to fetch movies' })
  }
})

export default router
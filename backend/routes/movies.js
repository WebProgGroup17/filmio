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

router.get('/search', async (req, res) => {
  try {
    const { title, genre, year } = req.query

    let movies = []

    if (title) {
      const allMovies = []

      let page = 1
      let totalPages = 1

      do {
        const params = new URLSearchParams({
          query: title,
          include_adult: 'false',
          page: page.toString(),
        })

        const response = await fetch(
          `${TMDB_BASE_URL}/search/movie?${params.toString()}`,
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

        allMovies.push(...data.results)

        totalPages = data.total_pages
        page++
      } while (page <= totalPages)

      movies = allMovies.filter((movie) =>
        movie.title.toLowerCase().includes(title.toLowerCase())
      )

      if (genre) {
        const genreId = Number(genre)

        movies = movies.filter((movie) =>
          movie.genre_ids?.includes(genreId)
        )
      }

      if (year) {
        movies = movies.filter((movie) =>
          movie.release_date?.startsWith(year)
        )
      }
    } else {
      const params = new URLSearchParams({
        include_adult: 'false',
        sort_by: 'popularity.desc',
      })

      if (genre) {
        params.append('with_genres', genre)
      }

      if (year) {
        params.append('primary_release_year', year)
      }

      const response = await fetch(
        `${TMDB_BASE_URL}/discover/movie?${params.toString()}`,
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

      movies = data.results
    }

    const searchResults = movies.map((movie) => ({
      id: movie.id,
      title: movie.title,
      releaseDate: movie.release_date,
      posterUrl: movie.poster_path
        ? `${TMDB_IMAGE_BASE}${movie.poster_path}`
        : null,
    }))

    res.json(searchResults)
  } catch (error) {
    console.error('Failed to search movies:', error)
    res.status(500).json({ error: 'Failed to search movies' })
  }
})

export default router
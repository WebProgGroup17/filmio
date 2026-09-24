import express from 'express'
import { pool } from '../helper/db.js'
import { auth } from '../helper/auth.js'

const router = express.Router()

const TMDB_BASE_URL = 'https://api.themoviedb.org/3'
const TMDB_IMAGE_BASE = 'https://image.tmdb.org/t/p/w500'

const GENRE_NAMES = {
  28: 'Action',
  12: 'Adventure',
  16: 'Animation',
  35: 'Comedy',
  80: 'Crime',
  99: 'Documentary',
  18: 'Drama',
  10751: 'Family',
  14: 'Fantasy',
  36: 'History',
  27: 'Horror',
  10402: 'Music',
  9648: 'Mystery',
  10749: 'Romance',
  878: 'Science Fiction',
  10770: 'TV Movie',
  53: 'Thriller',
  10752: 'War',
  37: 'Western',
}

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

  const searchResults = movies.map((movie) => {
    const genres = []

    for (const genreId of movie.genre_ids || []) { //protection if id is undefined
      const name = GENRE_NAMES[genreId]
      if (name) {
        genres.push(name)
      }
    }

    return {
      id: movie.id,
      title: movie.title,
      releaseDate: movie.release_date,
      genres: genres,
      posterUrl: movie.poster_path
        ? `${TMDB_IMAGE_BASE}${movie.poster_path}`
        : null,
    }
  })


    res.json(searchResults)
  } catch (error) {
    console.error('Failed to search movies:', error)
    res.status(500).json({ error: 'Failed to search movies' })
  }
})

//one movie
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params

    const response = await fetch(
      `${TMDB_BASE_URL}/movie/${id}`,
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

    const movie = await response.json()

    res.json({
      id: movie.id,
      title: movie.title,
      releaseYear: movie.release_date?.slice(0, 4),
      genres: movie.genres.map((genre) => genre.name),
      description: movie.overview,
      posterUrl: movie.poster_path
        ? `${TMDB_IMAGE_BASE}${movie.poster_path}`
        : null,
    })
  } catch (error) {
    console.error('Failed to fetch movie details:', error)
    res.status(500).json({ error: 'Failed to fetch movie details' })
  }
})

// Get reviews for one movie
router.get('/:id/reviews', async (req, res) => {
  try {
    const { id } = req.params

    const result = await pool.query(
      `
      SELECT
        r.review_id,
        r.review_text,
        r.stars,
        r.created_at,
        u.username
      FROM reviews r
      JOIN users u
        ON r.user_id = u.user_id
      WHERE r.tmdb_movie_id = $1
      ORDER BY r.created_at DESC
      `,
      [id]
    )

    res.status(200).json(result.rows)
  } catch (error) {
    console.error('Failed to fetch reviews:', error)
    res.status(500).json({
      error: 'Failed to fetch reviews',
    })
  }
})

// Add review for one movie
router.post('/:id/reviews', auth, async (req, res) => {
  try {
    const { id } = req.params
    const { review_text, stars } = req.body

    if (!review_text?.trim()) {
      return res.status(400).json({
        error: 'Review text is required',
      })
    }

    if (!Number.isInteger(stars) || stars < 1 || stars > 5) {
      return res.status(400).json({
        error: 'Stars must be between 1 and 5',
      })
    }

    const result = await pool.query(
      `
      INSERT INTO reviews (
        user_id,
        tmdb_movie_id,
        review_text,
        stars
      )
      VALUES ($1, $2, $3, $4)
      RETURNING *
      `,
      [
        req.user.userId,
        id,
        review_text,
        stars,
      ]
    )

    res.status(201).json(result.rows[0])
  } catch (error) {
    console.error('Failed to create review:', error)
    res.status(500).json({
      error: 'Failed to create review',
    })
  }
})


export default router
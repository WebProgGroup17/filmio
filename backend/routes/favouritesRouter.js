import { Router } from 'express'
import { pool } from '../helper/db.js'
import { auth } from '../helper/auth.js'

const router = Router()

const TMDB_BASE_URL = 'https://api.themoviedb.org/3'
const TMDB_IMAGE_BASE = 'https://image.tmdb.org/t/p/w500'

//POST=add a movie to favourites
router.post('/', auth, async (req, res, next) => {
  try {
    const tmdbMovieId = req.body.tmdbMovieId
    const userId = req.user.userId
    //if frontend sends tmdbMovieId=0 ->error
    if (!tmdbMovieId) {
      const error = new Error('tmdbMovieId is required')
      error.status = 400
      return next(error)
    }

    //check if movie is already in the list
    const existing = await pool.query(
      'SELECT favorite_id FROM favorites WHERE user_id = $1 AND tmdb_movie_id = $2',
      [userId, tmdbMovieId]
    )
    //if the movie is already in the list->error message
    if (existing.rows.length > 0) {
      return res.status(200).json({ message: 'Movie is already in favourites' })
    }
    //if the movie is not in the list, add it to the list
    await pool.query(
      'INSERT INTO favorites (user_id, tmdb_movie_id) VALUES ($1, $2)',
      [userId, tmdbMovieId]
    )
    return res.status(201).json({ message: 'Movie added to favorites' })

  } catch (error) {
    return next(error)
  }
})

//GET=get user's favourite movies
router.get('/', auth, async (req, res, next) => {
  try {
    const userId = req.user.userId

    const result = await pool.query(
      'SELECT tmdb_movie_id FROM favorites WHERE user_id = $1',
      [userId]
    )

    //create an empty list
    const movies = []

    //for each movie in results.row, get movie_id
    for (const row of result.rows) {
      const movieId = row.tmdb_movie_id
        //ask TMDB for info about movie which movieID is
      const response = await fetch(`${TMDB_BASE_URL}/movie/${movieId}`, {
        headers: {
          Authorization: `Bearer ${process.env.TMDB_API_KEY}`, //send API key from .env
          accept: 'application/json', //request response in json format
        },
      })

      if (response.ok) {
        const movie = await response.json() //convert  json to a js object
        //add  movie info to the list
        movies.push({
          id: movie.id,
          title: movie.title,
          posterUrl: movie.poster_path ? `${TMDB_IMAGE_BASE}${movie.poster_path}` : null,
        })
      }
    }

    return res.status(200).json(movies)
  } catch (error) {
    return next(error)
  }
})

//DELETE=remove a movie from favourites
router.delete('/:movieId', auth, async (req, res, next) => {
  try {
    //get the user id and movie id
    const movieId = req.params.movieId
    const userId = req.user.userId

    //removing the movie from db from this user
    const result = await pool.query(
      'DELETE FROM favorites WHERE user_id = $1 AND tmdb_movie_id = $2 RETURNING favorite_id',
      [userId, movieId]
    )
    //if the movie is not found in user's favourites ->error
    if (result.rowCount === 0) {
      const error = new Error('Favourite not found')
      error.status = 404
      return next(error)
    }
    //if successful, return a success message: response ok
    return res.status(200).json({ message: 'Movie removed from favourites' })
  } catch (error) {
    return next(error)
  }
})

export default router
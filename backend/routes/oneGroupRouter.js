import { Router } from 'express'
import { pool } from '../helper/db.js'
import { auth } from '../helper/auth.js'
import { checkGroupId, checkMember } from '../helper/groupHelper.js'

const router = Router()

router.param('groupId', checkGroupIdIsNumber)

//////// MOVIES

//list of movies, only id
router.get('/:groupId/movies', auth, async (req, res, next) => {
  try {
    const { groupId } = req.params
    await checkMember(groupId, req.user.userId)
    const result = await pool.query(
      `SELECT tmdb_movie_id, added_by
       FROM group_movies
       WHERE group_id = $1
       ORDER BY group_movie_id DESC`,
      [groupId]
    )
    return res.status(200).json(result.rows)
  } catch (error) {
    return next(error)
  }
})

//remove a movie (any member of the group)
router.delete('/:groupId/movies/:tmdbMovieId', auth, async (req, res, next) => {
  try {
    const { groupId, tmdbMovieId } = req.params
    await checkMember(groupId, req.user.userId)
    await pool.query(
      'DELETE FROM group_movies WHERE group_id = $1 AND tmdb_movie_id = $2',
      [groupId, tmdbMovieId]
    )
    return res.status(200).json({ message: 'Movie removed from group' })
  } catch (error) {
    return next(error)
  }
})

//////// MEMBERS

//add a person to group (any member)
router.post('/:groupId/members', auth, async (req, res, next) => {
  try {
    const { groupId } = req.params

    //if email is not given
    const email = req.body?.email
    if (!email) {
      const error = new Error('Email is required')
      error.status = 400
      return next(error)
    }
    //check if a person is a member of the group
    await checkMember(groupId, req.user.userId)

    //check if user exists
    const userResult = await pool.query(
      'SELECT user_id, email FROM users WHERE email = $1',
      [email]
    )
    if (userResult.rows.length === 0) {
      const error = new Error('User with this email not found')
      error.status = 404
      return next(error)
    }
    const newUser = userResult.rows[0]

    //add a new member
    const insertResult = await pool.query(
      `INSERT INTO group_members (group_id, user_id)
       VALUES ($1, $2)
       ON CONFLICT DO NOTHING
       RETURNING user_id`,
      [groupId, newUser.user_id]
    )
    //if db answers with 0 rows affected
    //a user is already in group
    if (insertResult.rows.length === 0) {
      const error = new Error('This user is already in the group')
      error.status = 400
      return next(error)
    }
    return res.status(201).json(newUser)
  } catch (error) {
    return next(error)
  }
})

//delete user from group (only owner)
router.delete('/:groupId/members/:userId', auth, async (req, res, next) => {
  try {
    const { groupId, userId } = req.params
    const group = await checkMember(groupId, req.user.userId)
    if (group.owner_id !== req.user.userId) {
      const error = new Error('Only the group owner can remove members')
      error.status = 403
      return next(error)
    }
    if (Number(userId) === group.owner_id) {
      const error = new Error('The owner cannot be removed from the group')
      error.status = 400
      return next(error)
    }
    await pool.query(
      'DELETE FROM group_members WHERE group_id = $1 AND user_id = $2',
      [groupId, userId]
    )
    return res.status(200).json({ message: 'Member removed' })
  } catch (error) {
    return next(error)
  }
})

//a member can leave the group
// DELETE /groups/:groupId/leave

router.delete('/:groupId/leave', auth, async (req, res, next) => {
  try {
    const { groupId } = req.params
    const userId = req.user.userId

    //check that the group exists and that the user is in it
    const group = await checkMember(groupId, userId)

    // Owner cannot leave
    if (group.owner_id === userId) {
      const error = new Error('Group owner cannot leave the group. Delete the group instead.')
      error.status = 403
      return next(error)
    }

    // Remove member
    await pool.query(
      `DELETE FROM group_members
       WHERE group_id = $1
       AND user_id = $2`,
      [groupId, userId]
    )

    return res.status(200).json({
      message: "Successfully left the group"
    })
  } catch (error) {
    return next(error)
  }
})

//requests to join the group (only owner)
router.get('/:groupId/join-requests', auth, async (req, res, next) => {
  try {
    const { groupId } = req.params
    const group = await checkMember(groupId, req.user.userId)
    //check if owner or not
    if (group.owner_id !== req.user.userId) {
      const error = new Error('Only the group owner can see join requests')
      error.status = 403
      return next(error)
    }
    const result = await pool.query(
      `SELECT jr.request_id, jr.user_id, u.email
       FROM join_requests jr
       JOIN users u ON u.user_id = jr.user_id
       WHERE jr.group_id = $1 AND jr.status = 'pending'
       ORDER BY jr.request_id DESC`,
      [groupId]
    )
    return res.status(200).json(result.rows)
  } catch (error) {
    return next(error)
  }
})

export default router


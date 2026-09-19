import { Router } from 'express'
import { pool } from '../helper/db.js'
import { auth } from '../helper/auth.js'

const router = Router()

router.param('groupId', (_req, _res, next, groupId) => {
  if (!/^\d+$/.test(groupId)) {
    const error = new Error('Invalid group id')
    error.status = 400
    return next(error)
  }
  next()
})

//create a group
router.post('/', auth,async (req, res, next) => {
  try {
    const name = req.body?.name
    if (!name) {
      const error = new Error('Group name is required')
      error.status = 400
      return next(error)
    }
    const client = await pool.connect()
    try {
      await client.query('BEGIN')
      const groupResult = await client.query(
        `INSERT INTO groups (name, owner_id) VALUES ($1, $2) RETURNING group_id, name, owner_id`,
        [name, req.user.userId]
      )
      const group = groupResult.rows[0]
      await client.query(
        'INSERT INTO group_members (user_id, group_id) VALUES ($1, $2)',
        [req.user.userId, group.group_id]
      )
      await client.query('COMMIT')
      return res.status(201).json(group)
    } catch (error) {
      await client.query('ROLLBACK')
      throw error
    } finally {
      client.release()
    }
  } catch (error) {
    return next(error)
  }
})

//list all groups
router.get('/', async (req, res, next) => {
  try {
    const result = await pool.query('SELECT group_id, name, owner_id FROM groups ORDER BY group_id desc')
    return res.status(200).json(result.rows)
  } catch (error) {
    return next(error)
  }
})

//List group members
router.get('/:groupId/members', auth, async (req, res, next) => {
  try {
    const { groupId } = req.params
    const groupResult = await pool.query('SELECT owner_id FROM groups WHERE group_id = $1', [groupId])
    if (groupResult.rows.length === 0) {
      const error = new Error('Group not found')
      error.status = 404
      return next(error)
    }
    if (groupResult.rows[0].owner_id !== req.user.userId) {
      const memberCheck = await pool.query(
        'SELECT 1 FROM group_members WHERE group_id = $1 AND user_id = $2',
        [groupId, req.user.userId]
      )
      if (memberCheck.rows.length === 0) {
        const error = new Error('You are not a member of this group')
        error.status = 403
        return next(error)
      }
    }
    const membersResult = await pool.query(
      `SELECT u.user_id, u.username
       FROM group_members gm
       JOIN users u ON u.user_id = gm.user_id
       WHERE gm.group_id = $1`,
      [groupId]
    )
    return res.status(200).json(membersResult.rows)
  } catch (error) {
    return next(error)
  }
})

//Group details
router.get('/:groupId', auth, async (req, res, next) => {
  try {
    const { groupId } = req.params
    const result = await pool.query('SELECT group_id, name, owner_id FROM groups WHERE group_id = $1', [groupId])
    if (result.rows.length === 0) {
      const error = new Error('Group not found')
      error.status = 404
      return next(error)
    }
    const group = result.rows[0]
    if (group.owner_id !== req.user.userId) {
      const memberResult = await pool.query(
        'SELECT 1 FROM group_members WHERE group_id = $1 AND user_id = $2',
        [groupId, req.user.userId]
      )
      if (memberResult.rows.length === 0) {
        const error = new Error('You are not a member of this group')
        error.status = 403
        return next(error)
      }
    }
    return res.status(200).json(group)
  } catch (error) {
    return next(error)
  }
})

//Delete a group (owner only)
router.delete('/:groupId', auth, async (req, res, next) => {
  try {
    const { groupId } = req.params
    const result = await pool.query('SELECT owner_id FROM groups WHERE group_id = $1', [groupId])
    if (result.rows.length === 0) {
      const error = new Error('Group not found')
      error.status = 404
      return next(error)
    }
    if (result.rows[0].owner_id !== req.user.userId) {
      const error = new Error('Only the group owner can delete this group')
      error.status = 403
      return next(error)
    }
    await pool.query('DELETE FROM groups WHERE group_id = $1', [groupId])
    return res.status(200).json({ message: 'Group deleted successfully' })
  } catch (error) {
    return next(error)
  }
})

//Join a group
router.post('/:groupId/join', auth, async (req, res, next) => {
  try {
    const { groupId } = req.params
    const result = await pool.query('SELECT group_id FROM groups WHERE group_id = $1', [groupId])
    if (result.rows.length === 0) {
      const error = new Error('Group not found')
      error.status = 404
      return next(error)
    }
    try {
      await pool.query('INSERT INTO group_members (user_id, group_id) VALUES ($1, $2)', [req.user.userId, groupId])
    } catch (error) {
      if (error.code === '23505') {
        const conflictError = new Error('You are already a member of this group')
        conflictError.status = 409
        return next(conflictError)
      }
      throw error
    }
    return res.status(201).json({ message: 'User joined the group successfully' })
  } catch (error) {
    return next(error)
  }
})

// DELETE /groups/:groupId/leave

router.delete('/:groupId/leave', auth, async (req, res, next) => {
  try {
    const { groupId } = req.params
    const userId = req.user.userId

    // Check group exists
    const groupResult = await pool.query(
      `SELECT owner_id
       FROM groups
       WHERE group_id = $1`,
      [groupId]
    )

    if (groupResult.rows.length === 0) {
      const error = new Error('Group not found')
      error.status = 404
      return next(error)
    }

    const group = groupResult.rows[0]

    // Owner cannot leave
    if (group.owner_id === userId) {
      const error = new Error('Group owner cannot leave the group. Delete the group instead.')
      error.status = 403
      return next(error)
    }

    // Check membership
    const memberResult = await pool.query(
      `SELECT *
       FROM group_members
       WHERE group_id = $1
       AND user_id = $2`,
      [groupId, userId]
    )

    if (memberResult.rows.length === 0) {
      const error = new Error('You are not a member of this group')
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

export default router
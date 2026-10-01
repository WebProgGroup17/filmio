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

router.get('/my', auth, async (req, res, next) => {
  try {
    const userId = req.user.userId;

    const result = await pool.query(
      `SELECT g.group_id, g.name, g.owner_id
       FROM groups g
       JOIN group_members gm ON g.group_id = gm.group_id
       WHERE gm.user_id = $1
       ORDER BY g.group_id DESC`,
      [userId]
    );

    return res.status(200).json(result.rows);
  } catch (error) {
    return next(error);
  }
});

router.get('/my/join-requests', auth, async (req, res, next) => {
  try {
    const userId = req.user.userId;

    const result = await pool.query(
      `SELECT request_id, group_id, status
       FROM join_requests
       WHERE user_id = $1`,
      [userId]
    );

    return res.status(200).json(result.rows);
  } catch (error) {
    return next(error);
  }
});

router.get('/my/received-join-requests', auth, async (req, res, next) => {
  try {
    const userId = req.user.userId;

    const result = await pool.query(
      `SELECT
         jr.request_id,
         jr.group_id,
         jr.user_id,
         jr.status,
         u.email,
         g.name AS group_name
       FROM join_requests jr
       JOIN users u ON u.user_id = jr.user_id
       JOIN groups g ON g.group_id = jr.group_id
       WHERE g.owner_id = $1
       AND jr.status = 'pending'
       ORDER BY jr.request_id DESC`,
      [userId]
    );

    return res.status(200).json(result.rows);
  } catch (error) {
    return next(error);
  }
});

router.patch('/join-requests/:requestId/accept', auth, async (req, res, next) => {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    const requestId = req.params.requestId;
    const ownerId = req.user.userId;

    // Find the request and make sure the logged-in user owns the group
    const requestResult = await client.query(
      `SELECT jr.request_id,
              jr.group_id,
              jr.user_id,
              jr.status
       FROM join_requests jr
       JOIN groups g ON g.group_id = jr.group_id
       WHERE jr.request_id = $1
       AND g.owner_id = $2
       AND jr.status = 'pending'`,
      [requestId, ownerId]
    );

    if (requestResult.rows.length === 0) {
      const error = new Error('Join request not found or not authorized');
      error.status = 404;
      throw error;
    }

    const joinRequest = requestResult.rows[0];

    // Add the user to the group
    await client.query(
      `INSERT INTO group_members (group_id, user_id)
       VALUES ($1, $2)
       ON CONFLICT DO NOTHING`,
      [joinRequest.group_id, joinRequest.user_id]
    );

    // Mark the request as accepted
    await client.query(
      `UPDATE join_requests
       SET status = 'accepted'
       WHERE request_id = $1`,
      [requestId]
    );

    await client.query('COMMIT');

    return res.status(200).json({
      message: 'Join request accepted',
      request_id: Number(requestId),
      group_id: joinRequest.group_id,
      user_id: joinRequest.user_id
    });

  } catch (error) {
    await client.query('ROLLBACK');
    return next(error);
  } finally {
    client.release();
  }
});

router.patch('/join-requests/:requestId/reject', auth, async (req, res, next) => {
  try {
    const requestId = req.params.requestId;
    const ownerId = req.user.userId;

    const result = await pool.query(
      `UPDATE join_requests jr
       SET status = 'rejected'
       FROM groups g
       WHERE jr.request_id = $1
       AND jr.group_id = g.group_id
       AND g.owner_id = $2
       AND jr.status = 'pending'
       RETURNING jr.request_id,
                 jr.group_id,
                 jr.user_id,
                 jr.status`,
      [requestId, ownerId]
    );

    if (result.rows.length === 0) {
      const error = new Error('Join request not found or not authorized');
      error.status = 404;
      return next(error);
    }

    return res.status(200).json({
      message: 'Join request rejected',
      request: result.rows[0]
    });

  } catch (error) {
    return next(error);
  }
});

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
    const groupId = req.params.groupId;
    const userId = req.user.userId;

    // Check if user is already a member
    const memberResult = await pool.query(
      `SELECT *
       FROM group_members
       WHERE group_id = $1 AND user_id = $2`,
      [groupId, userId]
    );

    if (memberResult.rows.length > 0) {
      const error = new Error('You are already a member of this group');
      error.status = 400;
      return next(error);
    }

    // Check if user already has a pending join request
    const requestResult = await pool.query(
      `SELECT *
       FROM join_requests
       WHERE group_id = $1
       AND user_id = $2
       AND status = 'pending'`,
      [groupId, userId]
    );

    if (requestResult.rows.length > 0) {
      const error = new Error('Join request already sent');
      error.status = 400;
      return next(error);
    }

    // Create join request
    const result = await pool.query(
      `INSERT INTO join_requests (group_id, user_id)
       VALUES ($1, $2)
       RETURNING request_id, group_id, user_id, status`,
      [groupId, userId]
    );

    return res.status(201).json(result.rows[0]);

  } catch (error) {
    return next(error);
  }
});

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
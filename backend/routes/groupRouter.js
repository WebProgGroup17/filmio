import { Router } from 'express'
import { pool } from '../helper/db.js'
import { auth } from '../helper/auth.js'
import { checkGroupId } from '../helper/group.js'

const router = Router()

router.param('groupId', checkGroupId)

//create a group
router.post('/', auth, async (req, res, next) => {
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
       WHERE user_id = $1 AND type = 'request'`,
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
      const error = new Error('You already have a pending request or invitation for this group');
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

//show invitations that a user received from groups
router.get('/my/invites', auth, async (req, res, next) => {
  try {
    const result = await pool.query(
      `SELECT jr.request_id AS invite_id, jr.group_id, g.name AS group_name
       FROM join_requests jr
       JOIN groups g ON g.group_id = jr.group_id
       WHERE jr.user_id = $1 AND jr.type = 'invite' AND jr.status = 'pending'
       ORDER BY jr.request_id DESC`,
      [req.user.userId]
    );
    return res.status(200).json(result.rows);
  } catch (error) {
    return next(error);
  }
});

//user accepts invitation from a group
//tietokannan transaktio tässä
router.patch('/invites/:inviteId/accept', auth, async (req, res, next) => {
  const acceptInvite = await pool.connect();
  try {
    await acceptInvite.query('BEGIN');
    const found = await acceptInvite.query(
      `SELECT group_id FROM join_requests
       WHERE request_id = $1 AND user_id = $2
       AND type = 'invite' AND status = 'pending'`,
      [req.params.inviteId, req.user.userId]
    );
    if (found.rows.length === 0) {
      const error = new Error('Invitation not found');
      error.status = 404;
      throw error;
    }
    await acceptInvite.query(
      `INSERT INTO group_members (group_id, user_id)
       VALUES ($1, $2) ON CONFLICT DO NOTHING`,
      [found.rows[0].group_id, req.user.userId]
    );
    await acceptInvite.query(
      `UPDATE join_requests SET status = 'accepted' WHERE request_id = $1`,
      [req.params.inviteId]
    );
    await acceptInvite.query('COMMIT');
    return res.status(200).json({ message: 'Invitation accepted' });
  } catch (error) {
    await acceptInvite.query('ROLLBACK');
    return next(error);
  } finally {
    acceptInvite.release();
  }
});

//decline invitation
router.patch('/invites/:inviteId/reject', auth, async (req, res, next) => {
  try {
    const result = await pool.query(
      `UPDATE join_requests SET status = 'rejected'
       WHERE request_id = $1 AND user_id = $2
       AND type = 'invite' AND status = 'pending'
       RETURNING request_id`,
      [req.params.inviteId, req.user.userId]
    );
    if (result.rows.length === 0) {
      const error = new Error('Invitation not found');
      error.status = 404;
      return next(error);
    }
    return res.status(200).json({ message: 'Invitation declined' });
  } catch (error) {
    return next(error);
  }
});


  // create a chat message
  router.post('/:groupId/chat', auth,async (req,res,next) => {
    try {
      const { groupId} =req.params;
      const { text } =req.body;
      const userId = req.user.userId;

      if (!text?.trim()) {
      const error = new Error('Message cannot be empty');
      error.status = 400;
      return next(error);
      } 
      
      // Check membership
      const memberResult = await pool.query(
      `SELECT *
       FROM group_members
       WHERE group_id = $1
       AND user_id = $2`,
      [groupId, userId]
      );

      if (memberResult.rows.length === 0) {
      const error = new Error('You are not a member of this group')
      error.status = 403
      return next(error)
      }

      const messageResult = await pool.query(
        `INSERT INTO chat
         (group_id, user_id, text, created_at)
         VALUES ($1, $2, $3, NOW())
         RETURNING *`,
         [groupId, userId, text]
      );
      res.status(201).json(messageResult.rows[0]);
    }catch(error){
      next(error);
    }
})

//get a message 
router.get('/:groupId/chat', auth, async (req, res, next) => {
  try {
    const { groupId } = req.params;
    const userId = req.user.userId;

    // Check membership
    const memberResult = await pool.query(
      `SELECT *
       FROM group_members
       WHERE group_id = $1
       AND user_id = $2`,
      [groupId, userId]
    );

    if (memberResult.rows.length === 0) {
      const error = new Error('You are not a member of this group');
      error.status = 403;
      return next(error);
    }

    const messageResult = await pool.query(
      `SELECT
          c.message_id,
          c.text,
          c.created_at,
          u.user_id,
          u.email
       FROM chat c
       JOIN users u
         ON c.user_id = u.user_id
       WHERE c.group_id = $1
       ORDER BY c.created_at ASC`,
      [groupId]
    );

    res.json(messageResult.rows);
  } catch (error) {
    next(error);
  }
});




export default router

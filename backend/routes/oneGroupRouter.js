import { Router } from 'express'
import { pool } from '../helper/db.js'
import { auth } from '../helper/auth.js'
import { checkGroupId, checkMember } from '../helper/group.js'

const router = Router()

router.param('groupId', checkGroupId)

//////// USERS

//group details
router.get('/:groupId', auth, async (req, res, next) => {
    try {
        const { groupId } = req.params
        const group = await checkMember(groupId, req.user.userId)
        return res.status(200).json(group)
    } catch (error) {
        return next(error)
    }
})

//list of members
router.get('/:groupId/members', auth, async (req, res, next) => {
    try {
        const { groupId } = req.params
        await checkMember(groupId, req.user.userId)
        const membersResult = await pool.query(
            `SELECT u.user_id, u.email
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
        //check if a user is a member
        const isMember = await pool.query(
            'SELECT 1 FROM group_members WHERE group_id = $1 AND user_id = $2',
            [groupId, newUser.user_id]
        )
        //if is a member, error
        if (isMember.rows.length > 0) {
            const error = new Error('This user is already in the group')
            error.status = 400
            return next(error)
        }

        //check if there is already a pending request or invitation
        const pending = await pool.query(
            `SELECT 1 FROM join_requests
             WHERE group_id = $1 AND user_id = $2 AND status = 'pending'`,
            [groupId, newUser.user_id]
        )
        //user is already invited/requested
        if (pending.rows.length > 0) {
            const error = new Error('This user already has a pending request or invitation')
            error.status = 400
            return next(error)
        }

        //create an invitation to user from group
        await pool.query(
            `INSERT INTO join_requests (group_id, user_id, type)
             VALUES ($1, $2, 'invite')`,
            [groupId, newUser.user_id]
        )
        return res.status(201).json({ message: 'Invitation sent' })
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
       WHERE jr.group_id = $1 AND jr.status = 'pending' AND jr.type = 'request'
       ORDER BY jr.request_id DESC`,
            [groupId]
        )
        return res.status(200).json(result.rows)
    } catch (error) {
        return next(error)
    }
})

//requests accept
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

//request rejected
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

//delete the group (only owner)
router.delete('/:groupId', auth, async (req, res, next) => {
    try {
        const { groupId } = req.params
        const group = await checkMember(groupId, req.user.userId)

        //only the owner can delete the group
        if (group.owner_id !== req.user.userId) {
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

export default router


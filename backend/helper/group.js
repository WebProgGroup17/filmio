import { pool } from './db.js'

//check if groupId is a number
export function checkGroupId(_req, _res, next, groupId) {
  if (!/^\d+$/.test(groupId)) {
    const error = new Error('Invalid group id')
    error.status = 400
    return next(error)
  }
  next()
}


export async function checkMember(groupId, userId) {
  const groupResult = await pool.query(
    'SELECT group_id, name, owner_id FROM groups WHERE group_id = $1',
    [groupId]
  )
  //check if a group excists
  if (groupResult.rows.length === 0) {
    const error = new Error('Group not found')
    error.status = 404
    throw error
  }
  const group = groupResult.rows[0]

  //check if a user is a member of the group
  if (group.owner_id !== userId) {
    const memberResult = await pool.query(
      'SELECT 1 FROM group_members WHERE group_id = $1 AND user_id = $2',
      [groupId, userId]
    )
    if (memberResult.rows.length === 0) {
      const error = new Error('You are not a member of this group')
      error.status = 403
      throw error
    }
  }
  return group
}
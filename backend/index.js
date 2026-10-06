import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import http from 'http'
import {Server} from 'socket.io'
import moviesRouter from './routes/movies.js' 
import userRouter from './routes/userRouter.js' 
import fs from 'fs'
import jwt from 'jsonwebtoken'
import { pool } from './helper/db.js'
import groupRouter from './routes/groupRouter.js'
import oneGroupRouter from './routes/oneGroupRouter.js'
import favouritesRouter from './routes/favouritesRouter.js'

if (fs.existsSync('../.env')) {
  dotenv.config({ path: '../.env' }) //.env from root of the main folder
}
const app = express()
const server = http.createServer(app)
const port = process.env.PORT || 3001

app.use(cors())
app.use(express.json())

//Set up Socket.io
const io = new Server(server, {
  cors: {
  origin: `http://localhost:${process.env.FRONTEND_PORT || 3000}`,
  methods: ['GET', 'POST']
}
});
app.set('io', io);

// Authenticate every socket with the same JWT used by the REST API
io.use((socket, next) => {
  try {
    socket.data.user = jwt.verify(socket.handshake.auth?.token, process.env.JWT_SECRET)
    next()
  } catch {
    next(new Error('Invalid or expired token'))
  }
})

// Handle socket connections
io.on('connection', (socket) => {
  console.log('User connected:', socket.id)
  socket.on('joinGroup', async (groupId, ack) => {
    try {
      // Only group members may join the room
      const member = await pool.query(
        'SELECT 1 FROM group_members WHERE group_id = $1 AND user_id = $2',
        [groupId, socket.data.user.userId]
      )
      if (member.rows.length === 0) {
        return ack?.({ ok: false, error: 'You are not a member of this group' })
      }
      socket.join(`group-${groupId}`);
      console.log(`${socket.id} joined group-${groupId}`);
      ack?.({ ok: true })
    } catch (error) {
      console.error(error)
      ack?.({ ok: false, error: 'Failed to join group' })
    }
  });
  socket.on('leaveGroup', (groupId) => {
    socket.leave(`group-${groupId}`);
  });
  socket.on('disconnect', () => {
  console.log('User disconnected:', socket.id)
})
})


app.get("/", (req, res) => {
  res.json({ message: "Filmio backend is running" });
});
app.use('/movies', moviesRouter)
app.use('/users', userRouter)
app.use('/groups', groupRouter)
app.use('/groups', oneGroupRouter)
app.use('/favourites', favouritesRouter)

// Error middleware
app.use((err,req,res,next) => {
  console.error(err)
  const statusCode = err.status || 500
  res.status(statusCode).json({
   error: {
   message: err.message,
   status: statusCode
   }
 })
})

server.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
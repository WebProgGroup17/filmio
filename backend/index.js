import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import http from 'http'
import {Server} from 'socket.io'
import moviesRouter from './routes/movies.js' 
import userRouter from './routes/userRouter.js' 
import fs from 'fs'
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
  origin: 'http://localhost:3000', 
  methods: ['GET', 'POST']
}
});
app.set('io', io);

// Handle socket connections
io.on('connection', (socket) => {
  console.log('User connected:', socket.id)
  socket.on('joinGroup', (groupId) => {
    socket.join(`group-${groupId}`);
    console.log(`${socket.id} joined group-${groupId}`);
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
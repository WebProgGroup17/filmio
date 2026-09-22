import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import moviesRouter from './routes/movies.js' 
import userRouter from './routes/userRouter.js' 
import fs from 'fs'
import groupRouter from './routes/groupRouter.js'
import favouritesRouter from './routes/favouritesRouter.js'

if (fs.existsSync('../.env')) {
  dotenv.config({ path: '../.env' }) //.env from root of the main folder
}
const app = express()
const port = process.env.PORT || 3001

app.use(cors())
app.use(express.json())

app.get("/", (req, res) => {
  res.json({ message: "Filmio backend is running" });
});
app.use('/movies', moviesRouter)
app.use('/users', userRouter)
app.use('/groups', groupRouter)
app.use('/favorites', favouritesRouter)

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

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
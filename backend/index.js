import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import moviesRouter from './routes/movies.js' 
import fs from 'fs'

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




app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
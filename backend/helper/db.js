import pkg from 'pg'
import dotenv from 'dotenv'
dotenv.config({ path: '../.env' })

/*
for debugging the DB connection:

make sure that the values printed in the terminal match the values in your .env file in the filmio folder

console.log('DB config:', {
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT
})
*/

const environment = process.env.NODE_ENV || 'development'
const { Pool } = pkg
const openDb = () => {
const pool = new Pool({
user: process.env.DB_USER,
host: process.env.DB_HOST,
database: process.env.DB_NAME,
password: process.env.DB_PASSWORD,
port: process.env.DB_PORT
})
return pool
}
const pool = openDb()
export { pool }
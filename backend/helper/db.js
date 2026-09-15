import pkg from 'pg'
import 'dotenv/config'

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
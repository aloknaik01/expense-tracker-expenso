import pg from 'pg';
import dotenv from 'dotenv';
dotenv.config();

pg.types.setTypeParser(1700, (v) => parseFloat(v)); 
pg.types.setTypeParser(1082, (v) => v); 

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

export default pool;
import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

if (!process.env.DB_URL) {
  console.error('Fatal: DB_URL environment variable is required');
  process.exit(1);
}

export const pool = new Pool({
  connectionString: process.env.DB_URL,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

export async function testConnection(): Promise<void> {
  const client = await pool.connect();
  try {
    await client.query('SELECT 1');
    console.log('Database connection established successfully');
  } finally {
    client.release();
  }
}

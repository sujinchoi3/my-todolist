import { QueryResult } from 'pg';
import { pool } from '../config/database';

export async function query<T extends Record<string, unknown> = Record<string, unknown>>(
  sql: string,
  params?: unknown[]
): Promise<QueryResult<T>> {
  return pool.query<T>(sql, params);
}

export async function queryOne<T extends Record<string, unknown> = Record<string, unknown>>(
  sql: string,
  params?: unknown[]
): Promise<T | null> {
  const result = await pool.query<T>(sql, params);
  return result.rows[0] ?? null;
}

export async function execute(sql: string, params?: unknown[]): Promise<number> {
  const result = await pool.query(sql, params);
  return result.rowCount ?? 0;
}

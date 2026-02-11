import { queryOne } from '../utils/db';
import { User } from '../types';

export async function findUserByEmail(email: string): Promise<User | null> {
  return queryOne(
    'SELECT user_id, email, name, password_hash, created_at, updated_at FROM users WHERE email = $1',
    [email]
  ) as Promise<User | null>;
}

export async function createUser(
  user_id: string,
  email: string,
  password_hash: string,
  name: string
): Promise<User> {
  const result = await queryOne(
    `INSERT INTO users (user_id, email, password_hash, name)
     VALUES ($1, $2, $3, $4)
     RETURNING user_id, email, name, created_at, updated_at`,
    [user_id, email, password_hash, name]
  );
  return result as unknown as User;
}

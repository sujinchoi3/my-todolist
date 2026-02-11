export interface User {
  user_id: string;
  email: string;
  name: string;
  password_hash?: string;
  created_at: Date;
  updated_at: Date;
}

export interface JwtPayload {
  user_id: string;
  email: string;
}

declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload;
    }
  }
}

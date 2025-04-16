import { Request, Response, NextFunction, RequestHandler } from 'express';
import jwt, { JwtPayload } from 'jsonwebtoken';
import dotenv from 'dotenv';
dotenv.config();


// Define the expected structure of req.user
export interface AuthenticatedUser extends JwtPayload {
  user_id: string;
  username: string;
}

// Extend Request to include user property
export interface AuthenticatedRequest extends Request {
  user?: AuthenticatedUser;
}

export const authenticate: RequestHandler = (req: Request, res: Response, next: NextFunction): void => {
  const authHeader = req.headers.authorization;
  console.log("Auth Middleware Triggered");
  const jwtSecret = process.env.JWT_SECRET_KEY;
  console.log("JWT Secret:", jwtSecret);
  console.log("Authorization Header:", authHeader);

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    console.log("No or invalid authorization header.");
    res.status(401).json({ failed: true, code: 'NOT_AUTHENTICATED' });
    return;
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY as string) as AuthenticatedUser;
    (req as AuthenticatedRequest).user = decoded;
    console.log("User authenticated:", decoded);
    next();
  } catch (error) {
    console.log("JWT verification failed:", error);
    res.status(401).json({ failed: true, code: 'NOT_AUTHENTICATED' });
  }
};

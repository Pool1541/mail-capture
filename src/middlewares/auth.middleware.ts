import { Request, Response, NextFunction } from "express";
import * as jwt from "jsonwebtoken";

interface DecodedToken {
  iss: string;
  sub: string;
  aud: string;
  exp: number;
  iat: number;
  email: string;
  phone: string;
  app_metadata: {
    provider: string;
    providers: string[];
  };
  user_metadata: {
    email: string;
    email_verified: boolean;
    phone_verified: boolean;
    sub: string;
  };
  role: string;
  aal: string;
  amr: arm[];
  session_id: string;
  is_anonymous: boolean;
}

interface arm {
  method: string;
  timestamp: number;
}

// Extend Express Request interface
declare module "express" {
  interface Request {
    user?: DecodedToken;
  }
}

class UnauthorizedError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "UnauthorizedError";
  }
}

export const isAuthenticatedUser = (req: Request, res: Response, next: NextFunction) => {
  const jwtSecret = process.env.SUPABASE_JWT_SECRET ?? "";

  if (!jwtSecret) {
    throw new Error("JWT secret is not defined in environment variables.");
  }

  const authHeader = req.headers.authorization;
  const token = authHeader?.split(" ")[1];

  if (!token) {
    next(new UnauthorizedError("No token provided"));
    return;
  }

  jwt.verify(token, jwtSecret, (err, decoded) => {
    if (err) {
      next(new UnauthorizedError("Invalid token"));
      return;
    }

    req.user = decoded as DecodedToken;
    next();
  });
};

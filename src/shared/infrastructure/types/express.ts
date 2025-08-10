import "express";

declare module "express-serve-static-core" {
  interface Request {
    user?: {
      email?: string;
      emailVerified?: boolean;
      sub?: string;
    };
    token?: string;
  }
}

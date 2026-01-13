import type { NextFunction, Request, Response } from "express";

import { AccessToken } from "@/auth/domain/access-token";
import { ServiceContainer } from "@/shared/infrastructure/service-container";
import { MissingAccessTokenError } from "@/auth/domain/errors";

export async function authMiddleware(req: Request, res: Response, next: NextFunction) {
  const authorizationHeader = req.headers.authorization;

  if (!authorizationHeader?.startsWith("Bearer ")) {
    throw new MissingAccessTokenError();
  }

  const token = authorizationHeader.split(" ")[1];

  const accessToken: AccessToken = await ServiceContainer.auth.validateAccessToken.execute(token);
  req.user = accessToken.getUserMetadata();
  req.token = token;

  next();
}

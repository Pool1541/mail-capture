import type { NextFunction, Request, Response } from "express";

import { AccessToken } from "@/auth/domain/access-token";
import { ServiceContainer } from "@/shared/infrastructure/service-container";

export async function authMiddleware(req: Request, res: Response, next: NextFunction) {
  const authorizationHeader = req.headers.authorization;

  if (!authorizationHeader?.startsWith("Bearer ")) {
    res.status(401).json({ error: "Missing JWT" });
    return;
  }

  const token = authorizationHeader.split(" ")[1];

  try {
    const accessToken: AccessToken = await ServiceContainer.auth.validateAccessToken.execute(token);
    req.user = accessToken.getUserMetadata();
    req.token = token;
    console.log({ req: req.user });
    next();
  } catch (error) {
    console.log(error);
    if (error instanceof Error) {
      res.status(401).json({ error: "Access token is invalid or expired" });
      return;
    }
    res.status(500).json({ error: "Internal server error" });
    return;
  }
}

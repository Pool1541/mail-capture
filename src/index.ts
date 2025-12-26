import "@/shared/infrastructure/monitoring/instrument";
import express, { Application, urlencoded, type NextFunction, type Request, type Response } from "express";
import helmet from "helmet";
import morgan from "morgan";
import cors from "cors";

import { userRouter } from "@/user/infrastructure/express-user-router";
import { authRouter } from "@/auth/infrastructure/express-auth-router";
import { resultRouter } from "@/result/infrastructure/express-result-router";
import { globalErrorHandler } from "@/shared/infrastructure/middleware/global-error-handler";
import { NotFoundError } from "./shared/domain/errors";

class Server {
  private app: Application;
  private port: string;

  constructor() {
    this.app = express();
    this.port = process.env.PORT ?? "8080";
    this.initializeMiddlewares();
    this.initializeRoutes();
    this.initializeErrorHandling();
  }

  private initializeMiddlewares(): void {
    this.app.use(helmet());
    this.app.use(cors());
    this.app.use(morgan("dev"));
    this.app.use(express.json());
    this.app.use(urlencoded({ extended: true }));
  }

  private initializeRoutes(): void {
    this.app.use("/users", userRouter);
    this.app.use("/auth", authRouter);
    this.app.use("/result", resultRouter);
  }

  private initializeErrorHandling(): void {
    this.app.use(this.handle404);
    this.app.use(globalErrorHandler);
  }

  private handle404 = (req: Request, res: Response, next: NextFunction): void => {
    const error = new NotFoundError("HTTP", `${req.method} ${req.path}`);

    next(error);
  };

  public listen(): void {
    this.app.listen(this.port, () => {
      console.log(`🚀 Server is running on port ${this.port}`);
    });
  }
}

const server = new Server();
server.listen();

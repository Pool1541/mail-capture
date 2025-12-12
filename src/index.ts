/* eslint-disable @typescript-eslint/no-unused-vars */
import express, { Application, urlencoded, type NextFunction, type Request, type Response } from "express";

import { userRouter } from "@/user/infrastructure/express-user-router";
import { authRouter } from "@/auth/infrastructure/express-auth-router";
import { resultRouter } from "@/result/infrastructure/express-result-router";
import { globalErrorHandler } from "@/shared/infrastructure/middleware/global-error-handler";
import { ScrapperWorker } from "@/result/infrastructure/workers/scrapper-worker";
import helmet from "helmet";
import morgan from "morgan";
import cors from "cors";

class Server {
  private app: Application;
  private port: string;

  constructor() {
    this.app = express();
    this.port = process.env.PORT ?? "8080";
    this.initializeMiddlewares();
    this.initializeRoutes();
  }

  private initializeMiddlewares(): void {
    this.app.use(cors());
    this.app.use(morgan("dev"));
    this.app.use(helmet());
    this.app.use(express.json());
    this.app.use(urlencoded({ extended: true }));
    this.app.use((req: Request, res: Response) => {
      res.status(404).json({
        error: {
          code: "ROUTE_NOT_FOUND",
          message: "Route not found",
          path: req.path,
          method: req.method,
        },
      });
    });
    this.app.use(globalErrorHandler);
  }

  private initializeRoutes(): void {
    this.app.use("/users", userRouter);
    this.app.use("/auth", authRouter);
    this.app.use("/result", resultRouter);
  }

  public listen(): void {
    this.app.listen(this.port, () => {
      console.log(`Server is running on port ${this.port}`);
    });
  }
}

const server = new Server();
server.listen();

const worker = new ScrapperWorker();
worker.start();

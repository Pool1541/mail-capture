/* eslint-disable @typescript-eslint/no-unused-vars */
import express, { type NextFunction, type Request, type Response } from "express";

import { userRouter } from "@/user/infrastructure/express-user-router";
import { authRouter } from "@/auth/infrastructure/express-auth-router";
import { resultRouter } from "@/result/infrastructure/express-result-router";
import { ScrapperWorker } from "@/result/infrastructure/workers/scrapper-worker";

const scrapperWorker = new ScrapperWorker();

const app = express();

app.use(express.json());

app.use("/users", userRouter);
app.use("/auth", authRouter);
app.use("/result", resultRouter);

app.use((req: Request, res: Response) => {
  res.status(404).json({ message: "Route not found" });
});

app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  if (err instanceof Error) {
    console.error(err.stack);
    res.status(500).json({ message: err.message });
    return;
  }
  console.error(err);
  res.status(500).json({ message: "Something went wrong" });
});

scrapperWorker.start();

app.listen(process.env.PORT ?? 3000, () => {
  console.log(`Server is running on http://localhost:${process.env.PORT ?? "3000"}`);
});

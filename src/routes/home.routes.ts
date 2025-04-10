/* eslint-disable @typescript-eslint/unbound-method */

import { Router } from "express";
import HomeController from "@/controllers/HomeController";

const homeRouter: Router = Router();

homeRouter.get("/", HomeController.index);
homeRouter.get("/health", HomeController.health);

export default homeRouter;

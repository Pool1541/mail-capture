import { Router } from "express";
import { WebHooksController } from "./../controllers/webhooksController";

const webhooksRouter = Router();
const webHooksController = new WebHooksController();

webhooksRouter.post("/webhook", (req, res) => webHooksController.supabaseWebHook(req, res));

export default webhooksRouter;

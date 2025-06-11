import { Router } from "express";
import { UserController } from "@/controllers/userController";
import { isAuthenticatedUser } from "@/middlewares/auth.middleware";

const userRouter: Router = Router();
const userController = new UserController();

userRouter.get("/userdata", isAuthenticatedUser, (req, res) => {
  userController.getUserData(req, res);
});

export default userRouter;

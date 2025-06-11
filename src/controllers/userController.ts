import { Request, Response } from "express";
import { UserService } from "../services/user.service";

export class UserController {
  private userService: UserService;

  constructor() {
    this.userService = new UserService();
  }

  public getUserData(req: Request, res: Response): void {
    const user = req.user;

    if (!user) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    const userInfo = this.userService.getUserInfo(user.sub);
    res.status(200).json(userInfo);
  }
}

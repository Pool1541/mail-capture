import { Request, Response } from "express";

class HomeController {
  public index(req: Request, res: Response): void {
    res.status(200).json({ message: "Congrats!" });
  }

  public health(req: Request, res: Response): void {
    res.send({ healthy: true });
  }
}

export default new HomeController();

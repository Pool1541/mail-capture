/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { Request, Response } from "express";
import { OutlookService } from "../services/outlook.service";

export class EmailController {
  private outlookService: OutlookService;

  constructor() {
    this.outlookService = new OutlookService();
  }

  async initialize(req: Request, res: Response): Promise<void> {
    try {
      const token = await this.outlookService.getAccessToken();
      res.status(200).json({
        message: "Access token retrieved successfully",
        token: token,
      });
    } catch (error) {
      res.status(500).json({
        message: "Error generating device code",
        error: (error as Error).message,
      });
    }
  }

  async getEmails(req: Request, res: Response): Promise<void> {
    try {
      const emails = await this.outlookService.retrieveMails();
      res.status(200).json(emails);
    } catch (error) {
      res.status(500).json({
        message: "Error retrieving emails",
        error: (error as Error).message,
      });
    }
  }
}

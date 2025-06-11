/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { Request, Response } from "express";
import { formateDate } from "@/utils/formate-date";

const SUPABASE_WEBHOOK_NAME = "supabase-webhook";

export class WebHooksController {
  public async supabaseWebHook(req: Request, res: Response): Promise<void> {
    const { "webhook-name": webhookName } = req.headers;
    const { record, old_record } = req.body as Record<string, any>;
    const userConfirmed = !old_record.confirmed_at && record.confirmed_at;

    if (webhookName === SUPABASE_WEBHOOK_NAME && userConfirmed) {
      // Registrar el usuario en la whitelist de la aplicación solo cuando se confirma el email del usuario.
      const date = new Date(record.created_at as number);
      console.log("User verified at: ", formateDate(date));
    }

    await new Promise((resolve) => setTimeout(resolve, 0));
    res.status(200).send();
  }
}

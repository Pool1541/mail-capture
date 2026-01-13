import { Resend } from "resend";

import { type EmailService, type SendEmailParams } from "../../domain/contracts/email-service";

import { EmailError } from "../errors/email-error";

const SENDER_EMAIL_ADDRESS = process.env.SENDER_EMAIL_ADDRESS ?? "mail-capture@resend.dev";

export class ResendEmailService implements EmailService {
  constructor(private readonly client: Resend) {}

  async send({ html, subject, to }: SendEmailParams): Promise<void> {
    try {
      const { data, error } = await this.client.emails.send({
        from: SENDER_EMAIL_ADDRESS,
        to,
        subject,
        html,
      });

      if (error) {
        const errorResponse = error as unknown as { name: string; message: string };
        throw new EmailError(`Email sending failed: ${errorResponse.message}`);
      }

      console.log("Email sent successfully:");
      console.log(JSON.stringify(data, null, 2));
    } catch (error) {
      if (error instanceof EmailError) throw error;

      throw new EmailError(`Unexpected error occurred: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
}

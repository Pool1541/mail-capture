/* eslint-disable @typescript-eslint/no-explicit-any */
export interface SendEmailParams {
  to: string[];
  subject: string;
  html: string;
  variables?: Record<string, any>;
}

export interface EmailService {
  send(params: SendEmailParams): Promise<void>;
}

export interface SendEmailParams {
  to: string[];
  subject: string;
  html: string;
  variables?: Record<string, unknown>;
}

export interface EmailService {
  send(params: SendEmailParams): Promise<void>;
}

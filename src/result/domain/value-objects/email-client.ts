import { ResultError } from "../errors";

export type EmailClientType = "hotmail" | "outlook" | "gmail" | "apple_mail";

export class EmailClient {
  private static readonly allowedClients: Record<string, EmailClientType> = {
    gmail: "gmail",
    outlook: "outlook",
    hotmail: "hotmail",
    icloud: "apple_mail",
    apple_mail: "apple_mail",
    apple: "apple_mail",
  };
  private static readonly defaultClient: EmailClientType = "hotmail";

  private value: EmailClientType;

  constructor(value: string) {
    this.validate(value);
    this.value = EmailClient.allowedClients[value];
  }

  private validate(value: string): void {
    if (!(value in EmailClient.allowedClients)) {
      throw new ResultError("emailClient", `Invalid EmailClient: ${value}`);
    }
  }

  static fromValue(value: string): EmailClient {
    const normalized = value.toLowerCase();

    if (!(normalized in EmailClient.allowedClients)) {
      throw new ResultError("emailClient", `Invalid EmailClient: ${value}`);
    }

    return new EmailClient(EmailClient.allowedClients[normalized]);
  }

  static fromEmail(email: string): EmailClient {
    const emailClientRegex = /@([a-zA-Z0-9.-]+)\./;
    const match = emailClientRegex.exec(email);

    const domain = match?.[1]?.toLowerCase() ?? EmailClient.defaultClient;

    return new EmailClient(EmailClient.allowedClients[domain] ?? EmailClient.defaultClient);
  }

  getValue(): EmailClientType {
    return this.value;
  }

  equals(other: EmailClient): boolean {
    return this.value === other.getValue();
  }

  toString(): string {
    return this.value;
  }
}

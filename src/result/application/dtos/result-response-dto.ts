import { EmailClientType } from "@/shared/domain/value-objects/email-client";

export interface ResultResponseDTO {
  id: string;
  messageId: string;
  createdAt: Date;
  opened: boolean;
  emailClient: EmailClientType;
  userId: string;
  resultUrl: string | null;
}

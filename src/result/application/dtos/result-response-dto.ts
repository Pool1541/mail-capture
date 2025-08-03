import { EmailClient } from "@/result/domain/result";

export interface ResultResponseDTO {
  id: string;
  messageId: string;
  createdAt: Date;
  opened: boolean;
  emailClient: EmailClient;
  userId: string;
  resultUrl: string | null;
}

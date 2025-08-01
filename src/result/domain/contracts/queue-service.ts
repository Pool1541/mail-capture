import type { QueueMessageBody, QueueMessageResult } from "./queue-message";

export interface QueueService {
  sendMessage(message: QueueMessageBody): Promise<void>;
  receiveMessages(): Promise<QueueMessageResult>;
  deleteMessage(receiptHandle: string): Promise<void>;
}

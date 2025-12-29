import type { QueueMessageBody, QueueMessageResult } from "./queue-message";

export interface QueueService<T = QueueMessageBody> {
  sendMessage(message: T): Promise<void>;
  receiveMessages(): Promise<QueueMessageResult>;
  deleteMessage(receiptHandle: string): Promise<void>;
}

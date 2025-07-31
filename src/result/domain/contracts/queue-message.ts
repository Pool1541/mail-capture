export interface QueueMessageResult {
  Messages: QueueMessage[] | undefined;
}

export interface QueueMessage {
  Attributes: Record<string, string>;
  Body: string;
  MessageId: string;
  ReceiptHandle: string;
}

export interface QueueMessageBody {
  messageId: string;
  sender: string;
  subject: string;
}

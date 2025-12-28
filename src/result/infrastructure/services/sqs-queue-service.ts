import { type QueueService } from "@/result/domain/contracts/queue-service";
import type { QueueMessage, QueueMessageBody, QueueMessageResult } from "@/result/domain/contracts/queue-message";

import {
  DeleteMessageCommand,
  Message,
  ReceiveMessageCommand,
  ReceiveMessageCommandOutput,
  SendMessageCommand,
  SQSClient,
} from "@aws-sdk/client-sqs";

export class SqsQueueService implements QueueService {
  constructor(
    private readonly sqsClient: SQSClient,
    private readonly queueUrl: string,
    private readonly maxNumberOfMessages: number,
    private readonly waitTimeSeconds: number,
    private readonly visibilityTimeout: number,
  ) {
    this.validateParams();
  }

  async sendMessage(message: QueueMessageBody): Promise<void> {
    const messageString = JSON.stringify(message);

    const command = new SendMessageCommand({
      QueueUrl: this.queueUrl,
      MessageBody: messageString,
    });

    await this.sqsClient.send(command);
  }

  async receiveMessages(): Promise<QueueMessageResult> {
    const command = new ReceiveMessageCommand({
      QueueUrl: this.queueUrl,
      MaxNumberOfMessages: this.maxNumberOfMessages,
      WaitTimeSeconds: this.waitTimeSeconds,
      VisibilityTimeout: this.visibilityTimeout,
    });

    const sqsResult = await this.sqsClient.send(command);
    const result = this.mapToQueueMessageResult(sqsResult);
    return result;
  }

  async deleteMessage(receiptHandle: string): Promise<void> {
    if (!receiptHandle) {
      throw new Error("Receipt handle is required to delete a message");
    }

    const command = new DeleteMessageCommand({
      QueueUrl: this.queueUrl,
      ReceiptHandle: receiptHandle,
    });

    await this.sqsClient.send(command);
  }

  private mapToQueueMessageResult(sqsResult: ReceiveMessageCommandOutput): QueueMessageResult {
    if (!sqsResult.Messages) {
      return { Messages: undefined };
    }

    const messages: QueueMessage[] = sqsResult.Messages.map((msg: Message) => ({
      Attributes: msg.Attributes ?? {},
      Body: msg.Body ?? "",
      MessageId: msg.MessageId ?? "",
      ReceiptHandle: msg.ReceiptHandle ?? "",
    }));

    return { Messages: messages };
  }

  private validateParams(): void {
    if (!this.queueUrl) {
      throw new Error("Queue URL is required");
    }

    if (this.maxNumberOfMessages <= 0 || this.maxNumberOfMessages > 10) {
      throw new Error("Max number of messages must be between 1 and 10");
    }

    if (this.waitTimeSeconds < 0 || this.waitTimeSeconds > 20) {
      throw new Error("Wait time seconds must be between 0 and 20");
    }

    if (this.visibilityTimeout < 0 || this.visibilityTimeout > 43200) {
      throw new Error("Visibility timeout must be between 0 and 43200 seconds");
    }
  }
}

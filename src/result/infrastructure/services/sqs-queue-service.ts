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

const sqs = new SQSClient({
  region: process.env.AWS_REGION ?? "us-east-1",
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID ?? "",
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY ?? "",
  },
});

const QUEUE_URL = process.env.SQS_QUEUE_URL;

const MAX_NUMBER_OF_MESSAGES = 1;
const WAIT_TIME_SECONDS = 20;
const VISIBILITY_TIMEOUT = 60;

if (!QUEUE_URL) {
  throw new Error("SQS_QUEUE_URL environment variable is required");
}

export class SqsQueueService implements QueueService {
  async sendMessage(message: QueueMessageBody): Promise<void> {
    const messageString = JSON.stringify(message);

    const command = new SendMessageCommand({
      QueueUrl: QUEUE_URL,
      MessageBody: messageString,
    });

    await sqs.send(command);
  }

  async receiveMessages(): Promise<QueueMessageResult> {
    const command = new ReceiveMessageCommand({
      QueueUrl: QUEUE_URL,
      MaxNumberOfMessages: MAX_NUMBER_OF_MESSAGES,
      WaitTimeSeconds: WAIT_TIME_SECONDS,
      VisibilityTimeout: VISIBILITY_TIMEOUT,
    });

    const sqsResult = await sqs.send(command);
    const result = this.mapToQueueMessageResult(sqsResult);
    return result;
  }

  async deleteMessage(receiptHandle: string): Promise<void> {
    if (!receiptHandle) {
      throw new Error("Receipt handle is required to delete a message");
    }

    const command = new DeleteMessageCommand({
      QueueUrl: QUEUE_URL,
      ReceiptHandle: receiptHandle,
    });

    await sqs.send(command);
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
}

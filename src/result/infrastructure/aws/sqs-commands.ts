import { DeleteMessageCommand, ReceiveMessageCommand, SendMessageCommand, SQSClient } from "@aws-sdk/client-sqs";

const sqs = new SQSClient({
  region: process.env.AWS_REGION ?? "us-east-1",
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID ?? "",
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY ?? "",
  },
});

const QUEUE_URL = process.env.SQS_QUEUE_URL;

if (!QUEUE_URL) {
  throw new Error("SQS_QUEUE_URL environment variable is required");
}

const MAX_NUMBER_OF_MESSAGES = 1;
const WAIT_TIME_SECONDS = 20;
const VISIBILITY_TIMEOUT = 60;

export async function recieveMessageCommand() {
  const command = new ReceiveMessageCommand({
    QueueUrl: QUEUE_URL,
    MaxNumberOfMessages: MAX_NUMBER_OF_MESSAGES,
    WaitTimeSeconds: WAIT_TIME_SECONDS,
    VisibilityTimeout: VISIBILITY_TIMEOUT,
  });

  return sqs.send(command);
}

export async function deleteMessageCommand(receiptHandle: string) {
  if (!receiptHandle) {
    throw new Error("Receipt handle is required to delete a message");
  }

  const command = new DeleteMessageCommand({
    QueueUrl: QUEUE_URL,
    ReceiptHandle: receiptHandle,
  });

  return sqs.send(command);
}

export async function sendMessageCommand(messageBody: string) {
  if (!messageBody) {
    throw new Error("Message body is required to send a message");
  }

  const command = new SendMessageCommand({
    QueueUrl: QUEUE_URL,
    MessageBody: messageBody,
  });

  return sqs.send(command);
}

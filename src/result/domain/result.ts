import type { RequireAtLeastOne } from "@/shared/types";

import { UserId } from "./value-objects/user-id";
import { ResultId } from "./value-objects/result-id";
import { ResultError } from "./errors/result-error";
import { ResultOpened } from "./value-objects/result-opened";
import { ResultCreatedAt } from "./value-objects/created-at";
import { EmailClient } from "./value-objects/email-client";

export class Result {
  id: ResultId | null;
  createdAt: ResultCreatedAt;
  openend: ResultOpened;
  emailClient: EmailClient;
  userId: UserId;
  resultUrl: string | null;
  messageId: string;

  constructor({
    id,
    createdAt,
    openend,
    emailClient,
    userId,
    resultUrl,
    messageId,
  }: {
    id?: ResultId;
    createdAt: ResultCreatedAt;
    openend: ResultOpened;
    emailClient: EmailClient;
    userId: UserId;
    resultUrl?: string;
    messageId: string;
  }) {
    this.id = id ?? null;
    this.createdAt = createdAt;
    this.openend = openend;
    this.emailClient = emailClient;
    this.userId = userId;
    this.resultUrl = resultUrl ?? null;
    this.messageId = messageId;
  }

  getId(): ResultId | null {
    return this.id;
  }

  isPersisted(): boolean {
    return this.id !== null;
  }

  requireId(): ResultId {
    if (!this.id) throw new ResultError("id", "Result must be persisted to access ID");

    return this.id;
  }

  getCreatedAt(): ResultCreatedAt {
    return this.createdAt;
  }

  getOpened(): ResultOpened {
    return this.openend;
  }

  getEmailClient(): EmailClient {
    return this.emailClient;
  }

  getUserId(): UserId {
    return this.userId;
  }

  getResultUrl(): string | null {
    return this.resultUrl;
  }

  requireResultUrl(): string {
    if (!this.resultUrl) throw new ResultError("resultUrl", "Result must be persisted to access URL");

    return this.resultUrl;
  }

  getMessageId(): string {
    return this.messageId;
  }

  equals(other: Result): boolean {
    if (!this.isPersisted() || !other.isPersisted()) return false;

    return this.requireId().equals(other.requireId());
  }

  update({ resultUrl, opened }: RequireAtLeastOne<{ resultUrl: string; opened: boolean }, "opened" | "resultUrl">): void {
    if (typeof resultUrl === "string") {
      this.resultUrl = resultUrl;
    }

    if (typeof opened === "boolean") {
      this.openend = new ResultOpened(opened);
    }
  }

  toJson(): object {
    return {
      id: this.requireId().getValue(),
      createdAt: this.createdAt.getValue(),
      openend: this.openend.getValue(),
      emailClient: this.emailClient,
      userId: this.userId.getValue(),
      resultUrl: this.resultUrl,
      messageId: this.messageId,
    };
  }

  static create({ email, messageId, userId }: { email: string; userId: UserId; messageId: string }): Result {
    return new Result({
      createdAt: new ResultCreatedAt(new Date()),
      openend: new ResultOpened(false),
      emailClient: EmailClient.fromEmail(email),
      userId,
      messageId,
    });
  }
}

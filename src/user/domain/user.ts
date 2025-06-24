import { UserId } from "./value-objects/user-id";
import { UserName } from "./value-objects/user-name";
import { UserError } from "./errors/user-error";
import { UserEmail } from "./value-objects/user-email";
import { UserAvatar } from "./value-objects/user-avatar";
import { UserCreatedAt } from "./value-objects/user-created-at";
import { UserUpdatedAt } from "./value-objects/user-updated-at";

export class User {
  private readonly id: UserId | null;
  private name: UserName | null;
  private email: UserEmail;
  private avatar: UserAvatar | null;
  private readonly createdAt: UserCreatedAt;
  private updatedAt: UserUpdatedAt;

  constructor({
    id,
    name,
    email,
    avatar,
    createdAt,
    updatedAt,
  }: {
    id?: UserId;
    name?: UserName;
    email: UserEmail;
    avatar?: UserAvatar;
    createdAt: UserCreatedAt;
    updatedAt: UserUpdatedAt;
  }) {
    this.id = id ?? null;
    this.name = name ?? null;
    this.email = email;
    this.avatar = avatar ?? null;
    this.createdAt = createdAt;
    this.updatedAt = updatedAt;
  }

  isPersisted(): boolean {
    return this.id !== null;
  }

  getId(): UserId | null {
    return this.id;
  }

  requireId(): UserId {
    if (!this.id) {
      throw new UserError("User must be persisted to access ID");
    }
    return this.id;
  }

  getName(): UserName | null {
    return this.name;
  }

  setName(name: UserName): void {
    this.name = name;
    this.updatedAt = new UserUpdatedAt(new Date());
  }

  getEmail(): UserEmail {
    return this.email;
  }

  setEmail(email: UserEmail): void {
    this.email = email;
    this.updatedAt = new UserUpdatedAt(new Date());
  }

  getAvatar(): UserAvatar | null {
    return this.avatar;
  }

  setAvatar(avatar: UserAvatar): void {
    this.avatar = avatar;
    this.updatedAt = new UserUpdatedAt(new Date());
  }

  getCreatedAt(): UserCreatedAt {
    return this.createdAt;
  }

  getUpdatedAt(): UserUpdatedAt {
    return this.updatedAt;
  }

  equals(other: User): boolean {
    if (!this.isPersisted() || !other.isPersisted()) return false;

    return this.requireId().equals(other.requireId());
  }

  toJSON(): object {
    return {
      id: this.requireId().getValue(),
      name: this.name?.getValue(),
      email: this.email.getValue(),
      avatar: this.avatar?.getValue(),
      createdAt: this.createdAt.toISOString(),
      updatedAt: this.updatedAt.toISOString(),
    };
  }

  static create({ email }: { email: UserEmail }): User {
    return new User({
      email,
      createdAt: new UserCreatedAt(new Date()),
      updatedAt: new UserUpdatedAt(new Date()),
    });
  }
}

import { describe, it, expect, beforeEach } from "vitest";
import { User } from "@/user/domain/user";
import { UserId } from "@/user/domain/value-objects/user-id";
import { UserName } from "@/user/domain/value-objects/user-name";
import { UserEmail } from "@/user/domain/value-objects/user-email";
import { UserAvatar } from "@/user/domain/value-objects/user-avatar";
import { UserCreatedAt } from "@/user/domain/value-objects/user-created-at";
import { UserUpdatedAt } from "@/user/domain/value-objects/user-updated-at";

describe("User", () => {
  let id: UserId;
  let name: UserName;
  let email: UserEmail;
  let avatar: UserAvatar;
  let createdAt: UserCreatedAt;
  let updatedAt: UserUpdatedAt;
  let user: User;

  beforeEach(() => {
    id = new UserId("1291e2c4-dc09-498b-84ee-a5f0b936fdab");
    name = new UserName("Alice");
    email = new UserEmail("alice@example.com");
    avatar = new UserAvatar("https://avatar.com/alice.png");
    createdAt = new UserCreatedAt(new Date("2023-01-01T00:00:00.000Z"));
    updatedAt = new UserUpdatedAt(new Date("2023-01-01T00:00:00.000Z"));
    user = new User({ id, name, email, avatar, createdAt, updatedAt });
  });

  it("should return correct id", () => {
    expect(user.getId()).toBe(id);
  });

  it("should return correct name", () => {
    expect(user.getName()).toBe(name);
  });

  it("should set name and update updatedAt", () => {
    const newName = new UserName("Bob");
    const before = user.getUpdatedAt().toISOString();
    user.setName(newName);
    expect(user.getName()).toBe(newName);
    expect(user.getUpdatedAt().toISOString()).not.toBe(before);
  });

  it("should return correct email", () => {
    expect(user.getEmail()).toBe(email);
  });

  it("should set email and update updatedAt", () => {
    const newEmail = new UserEmail("bob@example.com");
    const before = user.getUpdatedAt().toISOString();
    user.setEmail(newEmail);
    expect(user.getEmail()).toBe(newEmail);
    expect(user.getUpdatedAt().toISOString()).not.toBe(before);
  });

  it("should return correct avatar", () => {
    expect(user.getAvatar()).toBe(avatar);
  });

  it("should set avatar and update updatedAt", () => {
    const newAvatar = new UserAvatar("https://avatar.com/bob.png");
    const before = user.getUpdatedAt().toISOString();
    user.setAvatar(newAvatar);
    expect(user.getAvatar()).toBe(newAvatar);
    expect(user.getUpdatedAt().toISOString()).not.toBe(before);
  });

  it("should return correct createdAt", () => {
    expect(user.getCreatedAt()).toBe(createdAt);
  });

  it("should return correct updatedAt", () => {
    expect(user.getUpdatedAt()).toBe(updatedAt);
  });

  it("should compare equality correctly", () => {
    const other = new User({ id, name, email, avatar, createdAt, updatedAt });
    expect(user.equals(other)).toBe(true);

    const differentId = new UserId("1291e2c4-dc09-498b-84ee-a5f0b936ffab");
    const other2 = new User({ id: differentId, name, email, avatar, createdAt, updatedAt });
    expect(user.equals(other2)).toBe(false);
  });

  it("should serialize to JSON correctly", () => {
    const json = user.toJSON();
    expect(json).toEqual({
      id: id.getValue(),
      name: name.getValue(),
      email: email.getValue(),
      avatar: avatar.getValue(),
      createdAt: createdAt.toISOString(),
      updatedAt: updatedAt.toISOString(),
    });
  });
});

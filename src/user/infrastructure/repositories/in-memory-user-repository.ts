/* eslint-disable @typescript-eslint/no-unused-vars */
import { type UserRepository } from "@/user/domain/contracts/user-repository";

import { User } from "@/user/domain/user";

export class InMemoryUserRepository implements UserRepository {
  private users: User[] = [];

  constructor(initialUsers: User[] = []) {
    this.users = initialUsers;
  }
  listAll(): Promise<User[]> {
    throw new Error("Method not implemented.");
  }

  findById(id: string): Promise<User | null> {
    throw new Error("Method not implemented.");
  }
  async findByEmail(email: string): Promise<User | null> {
    await Promise.resolve();
    return this.users.find((user) => user.getEmail().getValue() === email) ?? null;
  }
  save(user: User): Promise<void> {
    throw new Error("Method not implemented.");
  }
  delete(id: string): Promise<void> {
    throw new Error("Method not implemented.");
  }
  existsByEmail(email: string): Promise<boolean> {
    throw new Error("Method not implemented.");
  }
  update(user: User): Promise<void> {
    throw new Error("Method not implemented.");
  }
}

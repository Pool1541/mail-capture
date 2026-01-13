import { User } from "../user";

export interface UserRepository {
  listAll(): Promise<User[]>;
  findById(id: string): Promise<User | null>;
  findByEmail(email: string): Promise<User | null>;
  save(user: User): Promise<void>;
  delete(id: string): Promise<void>;
  existsByEmail(email: string): Promise<boolean>;
  update(user: User): Promise<void>;
}

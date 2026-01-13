import { Result } from "../result";

export interface ResultRepository {
  listAll(): Promise<Result[]>;
  findById(id: string): Promise<Result | null>;
  findByMessageId(messageId: string): Promise<Result | null>;
  save(result: Result): Promise<void>;
  delete(id: string): Promise<void>;
  update(result: Result): Promise<void>;
}

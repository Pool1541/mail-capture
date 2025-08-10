import { InvalidIdError } from "../errors/invalid-id";

export class Id {
  private readonly value: string;

  constructor(value: string) {
    if (!value) throw new InvalidIdError("Id cannot be empty");
    Id.ensureIsValid(value);
    this.value = value;
  }

  static ensureIsValid(value: string): void {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(value)) {
      throw new InvalidIdError("Invalid format for id");
    }
  }

  getValue(): string {
    return this.value;
  }

  equals(other: Id): boolean {
    return this.value === other.getValue();
  }
}

export class ResultOpened {
  private value: boolean;

  constructor(value: boolean) {
    this.value = value;
  }

  getValue(): boolean {
    return this.value;
  }

  markAsOpenend(): void {
    this.value = true;
  }

  equals(other: ResultOpened): boolean {
    return this.value === other.getValue();
  }
}

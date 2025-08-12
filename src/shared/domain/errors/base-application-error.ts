export abstract class BaseApplicationError extends Error {
  abstract readonly code: string;
  abstract readonly httpStatus: number;
  readonly module: string;

  constructor(
    module: string,
    message: string,
    public readonly details?: Record<string, unknown>,
  ) {
    super(message);
    this.name = this.constructor.name;
    this.module = module;
    Object.setPrototypeOf(this, new.target.prototype);
  }

  toJSON() {
    return {
      name: this.name,
      code: this.code,
      module: this.module,
      message: this.message,
      details: this.details,
    };
  }
}

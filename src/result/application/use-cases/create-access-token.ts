import { type IEmailClientService } from "@/result/domain/contracts/email-client-service";

export class CreateAccessToken {
  constructor(private readonly emailClientService: IEmailClientService) {}

  async execute() {
    return this.emailClientService.getAccessToken();
  }
}

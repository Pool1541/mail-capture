import { type ResultRepository } from "@/result/domain/contracts/result-repository";
import { type ResultResponseDTO } from "../dtos/result-response-dto";

export class FindResultByMessageId {
  constructor(private readonly resultRepository: ResultRepository) {}

  async execute(messageId: string): Promise<ResultResponseDTO | null> {
    const result = await this.resultRepository.findByMessageId(messageId);

    if (!result) return null;

    return {
      id: result.requireId().getValue(),
      messageId: result.getMessageId(),
      createdAt: result.getCreatedAt().getValue(),
      opened: result.getOpened().getValue(),
      emailClient: result.getEmailClient(),
      userId: result.getUserId().getValue(),
      resultUrl: result.requireResultUrl(),
    };
  }
}

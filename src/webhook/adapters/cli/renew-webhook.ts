import { ServiceContainer } from "@/shared/infrastructure/service-container";

const { webhookRenewalService } = ServiceContainer.webhook;

async function main() {
  await webhookRenewalService.run();
  process.exit(0);
}

main().catch((error: unknown) => {
  console.error("Error running webhook subscription renewal cron:", error);
  process.exit(1);
});

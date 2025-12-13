import { createClient } from "@supabase/supabase-js";

import { type Database } from "@/shared/infrastructure/types/supabase";
import { ValidationWorker } from "@/result/infrastructure/workers/validation-worker";
import { OutlookService } from "@/result/infrastructure/services/outlook-service";
import { ValidationQueueService } from "@/result/infrastructure/services/validation-queue-service";
import { ScraperQueueService } from "@/result/infrastructure/services/scraper-queue-service";
import { SupabaseUserRepository } from "@/user/infrastructure/repositories/supabase-user-repository";
import { SupabaseResultRepository } from "@/result/infrastructure/repositories/supabase-result-repository";

// Inicializar dependencias
const supabase = createClient<Database>(process.env.SUPABASE_URL ?? "", process.env.SUPABASE_SERVICE_ROLE ?? "");
const resultRepository = new SupabaseResultRepository(supabase);
const userRepository = new SupabaseUserRepository(supabase);
const outlookService = new OutlookService();
const validationQueueService = new ValidationQueueService();
const scraperQueueService = new ScraperQueueService();

// Crear e iniciar el worker de validación
const validationWorker = new ValidationWorker(validationQueueService, scraperQueueService, resultRepository, outlookService, userRepository);

validationWorker.start();

console.log("🚀 Validation worker process started");

// Manejar señales de cierre
process.on("SIGINT", () => {
  console.log("Stopping validation worker...");
  validationWorker.stop();
  process.exit(0);
});

process.on("SIGTERM", () => {
  console.log("Stopping validation worker...");
  validationWorker.stop();
  process.exit(0);
});

import { ScrapperWorker } from "@/result/infrastructure/workers/scrapper-worker";
import { ScraperQueueService } from "@/result/infrastructure/services/scraper-queue-service";

// Inicializar dependencias
const scraperQueueService = new ScraperQueueService();

// Crear e iniciar el worker de scraping
const scrapperWorker = new ScrapperWorker(scraperQueueService);

scrapperWorker.start();

console.log("🚀 Scraper worker process started");

// Manejar señales de cierre
process.on("SIGINT", () => {
  console.log("Stopping scraper worker...");
  scrapperWorker.stop();
  process.exit(0);
});

process.on("SIGTERM", () => {
  console.log("Stopping scraper worker...");
  scrapperWorker.stop();
  process.exit(0);
});

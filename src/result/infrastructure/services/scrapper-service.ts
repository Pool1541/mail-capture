import Scrape from "../../../../scrap-outlook-v2";

export async function runScrapper(body: unknown) {
  console.log("Running scrapper...", { body });

  const { subject, sender } = body as { subject: string; sender: string };

  const screenshotPath = await Scrape({ subject, sender });

  return screenshotPath;
}

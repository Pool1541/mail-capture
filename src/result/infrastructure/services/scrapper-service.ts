import Scrape from "../../../../scrap-outlook-v2";

export async function runScrapper(body: unknown) {
  console.log("Running scrapper...", { body });

  const { subject, sender } = body as { subject: string; sender: string };

  await Scrape({ subject, sender });
  // return new Promise((resolve) => {
  //   setTimeout(() => {
  //     console.log("Scrapper finished successfully.");
  //     resolve(true);
  //   }, 30000); // Simulate a 30 seconds scrapping process
  // });
}

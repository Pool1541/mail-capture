export async function runScrapper(body: unknown) {
  console.log("Running scrapper...", { body });

  return new Promise((resolve) => {
    setTimeout(() => {
      console.log("Scrapper finished successfully.");
      resolve(true);
    }, 30000); // Simulate a 30 seconds scrapping process
  });
}

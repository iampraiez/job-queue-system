import { Job } from "bullmq";

export default async function (job: Job) {
  const { url, selectors, maxPages, headers } = job.data;

  console.log(
    `[Scraping Worker] Processing Job ${job.id} - Attempt ${job.attemptsMade + 1}/${job.opts.attempts}`,
  );
  console.log(
    `[Scraping Worker] URL: ${url} | Pages: ${maxPages ?? 1} | Selectors: ${JSON.stringify(selectors ?? [])}`,
  );
  console.log(`[Scraping Worker] Headers: ${JSON.stringify(headers ?? {})}`);

  const pages = maxPages ?? 1;
  await new Promise((resolve) => setTimeout(resolve, 1500 * pages));

  if (Math.random() < 0.3) {
    throw new Error(`Target site ${url} returned 429 Too Many Requests.`);
  }

  console.log(`[Scraping Worker] Job ${job.id} scraped ${pages} page(s).`);

  return {
    scrapedAt: new Date(),
    url,
    pagesScraped: pages,
    results: [
      { selector: selectors?.[0] ?? "body", data: "…scraped content…" },
    ],
  };
}

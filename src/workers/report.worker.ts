import { Job } from "bullmq";

export default async function (job: Job) {
  const { reportType, userId, filters, format, emailTo } = job.data;

  console.log(
    `[Report Worker] Processing Job ${job.id} - Attempt ${job.attemptsMade + 1}/${job.opts.attempts}`,
  );
  console.log(
    `[Report Worker] Type: ${reportType} | User: ${userId} | Format: ${format} | Email: ${emailTo}`,
  );
  console.log(`[Report Worker] Filters: ${JSON.stringify(filters ?? {})}`);

  const reportUrl = "http://localhost:3000/public/report-template.pdf";

  await new Promise((resolve) => setTimeout(resolve, 20000));

  if (Math.random() < 0.35) {
    throw new Error(
      "Report generation service timed out during PDF rendering.",
    );
  }

  console.log(`[Report Worker] Job ${job.id} report generated.`);

  return {
    generatedAt: new Date(),
    // reportUrl: `https://reports.example.com/${userId}/${reportType}-${job.id}.${format ?? "pdf"}`,
    reportUrl: reportUrl,
    sentTo: emailTo ?? null,
  };
}

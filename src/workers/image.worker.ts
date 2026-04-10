import { Job } from "bullmq";

export default async function (job: Job) {
  const { imageUrl, operations, outputFormat, quality } = job.data;

  console.log(
    `[Image Worker] Processing Job ${job.id} - Attempt ${job.attemptsMade + 1}/${job.opts.attempts}`,
  );
  console.log(
    `[Image Worker] URL: ${imageUrl} | Ops: ${JSON.stringify(operations)} | Format: ${outputFormat} | Quality: ${quality}`,
  );

  const outputUrl = "http://localhost:3000/public/image.jpg";

  await new Promise((resolve) => setTimeout(resolve, 4000));

  if (Math.random() < 0.3) {
    throw new Error("Image processing service temporarily unavailable.");
  }

  console.log(`[Image Worker] Job ${job.id} processed successfully.`);

  return {
    processedAt: new Date(),
    // outputUrl: `https://cdn.example.com/processed/${job.id}.${outputFormat ?? "jpeg"}`,
    outputUrl: outputUrl,
    outputFormat: outputFormat ?? "jpeg",
  };
}

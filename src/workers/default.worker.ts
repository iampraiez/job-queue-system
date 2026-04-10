import { Job } from "bullmq";

/**
 * Sandboxed Worker
 *
 * This file is executed by BullMQ in a separate Node process (child_process).
 * Because it's isolated, even if this code does heavy CPU math or crashes,
 * your main Fastify web server stays perfectly smooth and responsive.
 */
export default async function (job: Job) {
  // We can't use `fastify.log` directly in here because this is a separate process!
  console.log(
    `[Sandboxed Worker] Started processing job ${job.id} of type ${job.name}`,
  );
  console.log(`[Sandboxed Worker] Finished job ${job.id}`);

  return { processedAt: new Date() };
}

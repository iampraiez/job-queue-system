import fp from "fastify-plugin";
import { FastifyPluginAsync } from "fastify";
import { Queue, Worker, Job } from "bullmq";
import Redis from "ioredis";
import { fileURLToPath } from "node:url";
import "dotenv/config";

declare module "fastify" {
  interface FastifyInstance {
    queues: {
      email: Queue;
      imageProcessing: Queue;
      reportGeneration: Queue;
      scraping: Queue;
    };
  }
}

const bullMqPlugin: FastifyPluginAsync = fp(async (fastify) => {
  const connectionUrl = process.env.REDIS_URL!!;
  const redisConnection = new Redis(connectionUrl, {
    maxRetriesPerRequest: null,
  });

  const handleCompleted = async (job: Job, returnvalue: unknown) => {
    fastify.log.info(`[${job.name}] Job ${job.id} completed.`);
    try {
      await fastify.prisma.job.update({
        where: { id: job.id },
        data: {
          status: "COMPLETED",
          result: returnvalue as object,
          attempts: job.attemptsMade,
        },
      });
    } catch (dbErr) {
      fastify.log.warn(`[Worker] Could not update status for completed job ${job.id}: record no longer exists.`);
    }
  };

  const handleFailed = async (job: Job | undefined, err: Error) => {
    fastify.log.error(`[Worker] Job ${job?.id} failed: ${err.message}`);
    const isFinalFailure = job && job.attemptsMade >= (job.opts.attempts ?? 1);
    if (job?.id) {
      try {
        await fastify.prisma.job.update({
          where: { id: job.id },
          data: {
            attempts: job.attemptsMade,
            ...(isFinalFailure && {
              status: "FAILED",
              result: `Final failure after ${job.attemptsMade} attempts: ${err.message}`,
              error: err.stack,
            }),
          },
        });
      } catch (dbErr) {
        // Job was deleted before this retry completed — nothing to update
        fastify.log.warn(`[Worker] Could not update status for job ${job.id}: record no longer exists.`);
      }
    }
  };

  // email
  const emailQueue = new Queue("email", {
    connection: redisConnection,
    defaultJobOptions: {
      attempts: 5,
      backoff: { type: "exponential", delay: 2000 },
    },
  });
  const emailWorker = new Worker(
    "email",
    fileURLToPath(new URL("../workers/email.worker.js", import.meta.url)),
    {
      connection: redisConnection,
      concurrency: 5,
      limiter: { max: 10, duration: 1000 },
    },
  );
  emailWorker.on("completed", handleCompleted);
  emailWorker.on("failed", handleFailed);
  // email

  // image
  const imageProcessingQueue = new Queue("image-processing", {
    connection: redisConnection,
    defaultJobOptions: {
      attempts: 4,
      backoff: { type: "exponential", delay: 3000 },
    },
  });
  const imageWorker = new Worker(
    "image-processing",
    fileURLToPath(new URL("../workers/image.worker.js", import.meta.url)),
    {
      connection: redisConnection,
      concurrency: 2,
    },
  );
  imageWorker.on("completed", handleCompleted);
  imageWorker.on("failed", handleFailed);
  // image

  // report
  const reportGenerationQueue = new Queue("report-generation", {
    connection: redisConnection,
    defaultJobOptions: {
      attempts: 3,
      backoff: { type: "exponential", delay: 5000 },
    },
  });
  const reportWorker = new Worker(
    "report-generation",
    fileURLToPath(new URL("../workers/report.worker.js", import.meta.url)),
    {
      connection: redisConnection,
      concurrency: 3,
      limiter: { max: 5, duration: 1000 },
    },
  );
  reportWorker.on("completed", handleCompleted);
  reportWorker.on("failed", handleFailed);
  // report

  // scraping
  const scrapingQueue = new Queue("scraping", {
    connection: redisConnection,
    defaultJobOptions: {
      attempts: 6,
      backoff: { type: "exponential", delay: 10000 },
    },
  });
  const scrapingWorker = new Worker(
    "scraping",
    fileURLToPath(new URL("../workers/scraping.worker.js", import.meta.url)),
    {
      connection: redisConnection,
      concurrency: 10,
      limiter: { max: 3, duration: 1000 },
    },
  );
  scrapingWorker.on("completed", handleCompleted);
  scrapingWorker.on("failed", handleFailed);
  // scraping

  fastify.decorate("queues", {
    email: emailQueue,
    imageProcessing: imageProcessingQueue,
    reportGeneration: reportGenerationQueue,
    scraping: scrapingQueue,
  });
  fastify.log.info("BullMQ: All 4 feature queues initialized.");

  fastify.addHook("onClose", async () => {
    fastify.log.info("Closing BullMQ connections gracefully...");
    await Promise.all([
      emailWorker.close(),
      imageWorker.close(),
      reportWorker.close(),
      scrapingWorker.close(),
      emailQueue.close(),
      imageProcessingQueue.close(),
      reportGenerationQueue.close(),
      scrapingQueue.close(),
    ]);
    await redisConnection.quit();
  });
}, { name: "bullMqPlugin", dependencies: ["prismaPlugin"] });

export default bullMqPlugin;

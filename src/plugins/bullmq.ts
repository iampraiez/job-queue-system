import fp from "fastify-plugin";
import { FastifyPluginAsync } from "fastify";
import { Queue, Worker, Job } from "bullmq";
import Redis from "ioredis";
import "dotenv/config";

declare module "fastify" {
  interface FastifyInstance {
    queues: {
      default: Queue;
    };
  }
}

const bullMqPlugin: FastifyPluginAsync = fp(async (fastify, opts) => {
  const connectionUrl = process.env.REDIS_URL!!;
  const redisConnection = new Redis(connectionUrl, {
    maxRetriesPerRequest: null,
  });

  const defaultQueue = new Queue("default", { connection: redisConnection });
  fastify.decorate("queues", {
    default: defaultQueue,
  });
  fastify.log.info("BullMQ Default Queue initialized.");

  const defaultWorker = new Worker(
    "default",
    async (job: Job) => {
      fastify.log.info(
        `[Worker] Started processing job ${job.id} of type ${job.name}`,
      );

      return { processedAt: new Date() };
    },
    { connection: redisConnection },
  );

  defaultWorker.on("completed", (job, returnvalue) => {
    fastify.log.info(`[Worker] Job ${job.id} completed successfully!`);
  });

  defaultWorker.on("failed", (job, err) => {
    fastify.log.error(
      `[Worker] Job ${job?.id} failed with error: ${err.message}`,
    );
  });

  fastify.addHook("onClose", async (fastify) => {
    fastify.log.info("Closing BullMQ connections gracefully...");
    await defaultWorker.close();
    await defaultQueue.close();
    await redisConnection.quit();
  });
});

export default bullMqPlugin;

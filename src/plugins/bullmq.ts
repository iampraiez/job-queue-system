import fp from "fastify-plugin";
import { FastifyPluginAsync } from "fastify";
import { Queue, Worker } from "bullmq";
import Redis from "ioredis";
import { fileURLToPath } from "node:url";
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

  const defaultWorkerPath = fileURLToPath(
    new URL("../workers/default.worker.js", import.meta.url),
  );

  const defaultWorker = new Worker("default", defaultWorkerPath, {
    connection: redisConnection,
  });

  defaultWorker.on("completed", async (job, returnvalue) => {
    console.log("Completed Job", job);
    await fastify.prisma.job.update({
      where: { id: job.id },
      data: {
        status: "COMPLETED",
        result: returnvalue,
      },
    });
    fastify.log.info(`[Worker] Job ${job.id} completed successfully!`);
  });

  defaultWorker.on("failed", async (job, err) => {
    // if (job.)
    await fastify.prisma.job.update({
      where: { id: job?.id!! },
      data: {
        status: "FAILED",
        result: err.message,
        error: err.stack,
      },
    });
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

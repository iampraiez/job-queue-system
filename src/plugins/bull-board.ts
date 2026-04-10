import fp from "fastify-plugin";
import { FastifyPluginAsync } from "fastify";
import { createBullBoard } from "@bull-board/api";
import { BullMQAdapter } from "@bull-board/api/bullMQAdapter";
import { FastifyAdapter } from "@bull-board/fastify";

const bullBoardPlugin: FastifyPluginAsync = fp(async (fastify) => {
  const serverAdapter = new FastifyAdapter();

  createBullBoard({
    queues: [
      new BullMQAdapter(fastify.queues.email, { readOnlyMode: true }),
      new BullMQAdapter(fastify.queues.imageProcessing, { readOnlyMode: true }),
      new BullMQAdapter(fastify.queues.reportGeneration, { readOnlyMode: true }),
      new BullMQAdapter(fastify.queues.scraping, { readOnlyMode: true }),
    ],
    serverAdapter,
  });

  // The UI will be served at http://localhost:3000/admin/queues
  serverAdapter.setBasePath("/admin/queues");
  fastify.register(serverAdapter.registerPlugin(), { prefix: "/admin/queues" });

  fastify.log.info(
    "Bull Board dashboard mounted at http://localhost:3000/admin/queues",
  );
}, { name: "bullBoardPlugin", dependencies: ["bullMqPlugin"] });

export default bullBoardPlugin;

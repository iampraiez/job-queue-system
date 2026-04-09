import { type FastifyPluginAsync } from "fastify";
import jobController from "./job/job.controller.js";

const root: FastifyPluginAsync = async (fastify, opts): Promise<void> => {
  fastify.get("/", async function (request, reply) {
    return { root: true };
  });

  jobController(fastify, opts);
};

export default root;

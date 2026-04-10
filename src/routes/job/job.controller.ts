import { type FastifyPluginAsync, FastifyRequest, FastifyReply } from "fastify";
import { jobRequestBodySchema } from "./jobs.parser.js";
import { JobService } from "./job.service.js";

export const jobController: FastifyPluginAsync = async (
  fastify,
  opts?: unknown,
): Promise<void> => {
  const jobService = new JobService(fastify.prisma, fastify.queues as any);

  fastify.post(
    "/job/create",
    async function (request: FastifyRequest, reply: FastifyReply) {
      try {
        const job_data = await jobRequestBodySchema.parseAsync(request.body);
        const result = await jobService.createJob(job_data);
        reply.status(201).send(result);
      } catch (error: unknown) {
        console.error("Error parsing request body:", error);
        reply.status(400).send({
          error: error instanceof Error ? error.message : "Error creating job",
        });
      }
    },
  );

  fastify.get(
    "/job/:id",
    async function (request: FastifyRequest, reply: FastifyReply) {
      const { id } = request.params as { id: string };
      const { userId } = request.query as { userId: string };
      try {
        const job = await jobService.getJob(id, userId);
        if (!job) {
          reply.status(404).send({ error: "Job not found" });
          return;
        }
        reply.status(200).send(job);
      } catch (error: unknown) {
        console.error("Error fetching job:", error);
        reply.status(500).send({
          error: error instanceof Error ? error.message : "Error fetching job",
        });
      }
    },
  );

  fastify.delete(
    "/job/:id",
    async function (request: FastifyRequest, reply: FastifyReply) {
      const { id } = request.params as { id: string };
      const { userId } = request.query as { userId: string };
      try {
        await jobService.deleteJob(id, userId);
        reply.status(200).send({ message: "Job deleted successfully" });
      } catch (error: unknown) {
        console.error("Error deleting job:", error);
        const MSG = error instanceof Error ? error.message : "";
        if (MSG === "Job not found") {
          reply.status(404).send({ error: MSG });
        } else if (MSG === "Job already completed") {
          reply.status(400).send({ error: MSG });
        } else {
          reply.status(500).send({
            error: MSG || "Error deleting job",
          });
        }
      }
    },
  );
};

export default jobController;

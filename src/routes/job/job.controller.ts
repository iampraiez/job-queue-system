import { type FastifyPluginAsync, FastifyRequest, FastifyReply } from "fastify";
import * as z from "zod";

interface jobRequestBody {
  type: "email" | "image-processing" | "report-generation" | "scraping";
}

const jobRequestBodySchema = z.object({
  type: z.enum([
    "email",
    "image-processing",
    "report-generation",
    "scraping",
  ] as const),
});

export const jobController: FastifyPluginAsync = async (
  fastify,
  opts?: unknown,
): Promise<void> => {
  fastify.post(
    "/job/create",
    async function (request: FastifyRequest, reply: FastifyReply) {
      try {
        const job_data = request.body as jobRequestBody;
        await jobRequestBodySchema.parseAsync(job_data);

        return job_data.type;
      } catch (error: unknown) {
        console.error("Error parsing request body:", error);
        reply.status(400).send({
          error: error instanceof Error ? error.message : "Unknown error",
        });
        return;
      }
    },
  );
};

export default jobController;

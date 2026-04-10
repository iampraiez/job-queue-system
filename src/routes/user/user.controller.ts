import { type FastifyPluginAsync, FastifyRequest, FastifyReply } from "fastify";
import * as z from "zod";

const userRequestBodySchema = z.object({
  name: z.string(),
  email: z.string().email(),
});

// created user just to have userId with the jobs,it's not that deep
export const userController: FastifyPluginAsync = async (
  fastify,
  opts?: unknown,
): Promise<void> => {
  fastify.get(
    "/user/:id",
    async function (request: FastifyRequest, reply: FastifyReply) {
      const { id } = request.params as { id: string };
      try {
        const user_response = await fastify.prisma.user.findUnique({
          where: { id },
        });
        if (!user_response) {
          reply.status(404).send({ error: "User not found" });
          return;
        }
        reply.send(user_response);
      } catch (error: unknown) {
        console.error("Error fetching user:", error);
        reply.status(500).send({
          error: error instanceof Error ? error.message : "Unknown error",
        });
      }
    },
  );

  fastify.post(
    "/user",
    async function (request: FastifyRequest, reply: FastifyReply) {
      try {
        const user_data = await userRequestBodySchema.parseAsync(request.body);
        let user_response = await fastify.prisma.user.findUnique({
          where: { email: user_data.email },
        });
        if (!user_response) {
          user_response = await fastify.prisma.user.create({
            data: user_data,
          });
        }
        reply.status(201).send(user_response);
      } catch (error: unknown) {
        console.error("Error parsing request body:", error);
        reply.status(400).send({
          error: error instanceof Error ? error.message : "Unknown error",
        });
      }
    },
  );

  fastify.delete(
    "/user/:id",
    async function (request: FastifyRequest, reply: FastifyReply) {
      const { id } = request.params as { id: string };
      try {
        const user_response = await fastify.prisma.user.delete({
          where: { id },
        });
        if (!user_response) {
          reply.status(404).send({ error: "User not found" });
          return;
        }
        reply.send("Deleted user successfully");
      } catch (error: unknown) {
        console.error("Error deleting user:", error);
        reply.status(500).send({
          error: error instanceof Error ? error.message : "Error deleting user",
        });
      }
    },
  );
};

export default userController;

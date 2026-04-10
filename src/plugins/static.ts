import fp from "fastify-plugin";
import staticPlugin from "@fastify/static";
import { join } from "node:path";

export default fp(async (fastify) => {
  fastify.register(staticPlugin, {
    root: join(process.cwd(), "public"),
    prefix: "/public/",
  });
});

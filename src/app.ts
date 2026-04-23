import Fastify from "fastify";
import fastifyRateLimit from "@fastify/rate-limit";
import { env } from "./config/env.js";
import { prismaPlugin } from "./plugins/prisma.js";
import { jwtPlugin } from "./plugins/jwt.js";
import { swaggerPlugin } from "./plugins/swagger.js";
import { authRoutes } from "./routes/auth.routes.js";
import { taskRoutes } from "./routes/task.routes.js";
import { userRoutes } from "./routes/user.routes.js";
import { healthRoutes } from "./routes/health.routes.js";
import { auditRoutes } from "./routes/audit.routes.js";
import { AppError } from "./utils/errors.js";

export async function buildApp() {
  const app = Fastify({ logger: true });

  await app.register(fastifyRateLimit, {
    max: 100,
    timeWindow: "1 minute"
  });

  await app.register(prismaPlugin);
  await app.register(jwtPlugin);
  await app.register(swaggerPlugin);

  await app.register(healthRoutes, { prefix: env.API_PREFIX });
  await app.register(authRoutes, { prefix: env.API_PREFIX });
  await app.register(taskRoutes, { prefix: env.API_PREFIX });
  await app.register(userRoutes, { prefix: env.API_PREFIX });
  await app.register(auditRoutes, { prefix: env.API_PREFIX });

  app.setErrorHandler((error, request, reply) => {
    if (error instanceof AppError) {
      return reply.code(error.statusCode).send({ message: error.message });
    }

    if (error instanceof Error && error.name === "ZodError") {
      return reply.code(400).send({ message: "Validation failed", details: error });
    }

    request.server.log.error(error);
    return reply.code(500).send({ message: "Internal server error" });
  });

  return app;
}

import { FastifyInstance } from "fastify";
import { healthHandler } from "../controllers/health.controller.js";

export async function healthRoutes(app: FastifyInstance) {
  app.get("/health", healthHandler);
}

import { FastifyInstance } from "fastify";
import {
  bootstrapAdminHandler,
  googleLoginHandler,
  loginHandler,
  refreshTokenHandler,
  registerHandler
} from "../controllers/auth.controller.js";

export async function authRoutes(app: FastifyInstance) {
  app.post("/auth/bootstrap-admin", bootstrapAdminHandler);
  app.post("/auth/register", registerHandler);
  app.post("/auth/login", loginHandler);
  app.post("/auth/google", googleLoginHandler);
  app.post("/auth/refresh", refreshTokenHandler);
}

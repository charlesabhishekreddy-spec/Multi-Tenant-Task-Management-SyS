import { FastifyInstance } from "fastify";
import {
  createUserHandler,
  listUsersHandler,
  updateRoleHandler
} from "../controllers/user.controller.js";
import { authMiddleware } from "../middleware/auth.middleware.js";
import { requireRole } from "../middleware/rbac.middleware.js";
import { tenantMiddleware } from "../middleware/tenant.middleware.js";

export async function userRoutes(app: FastifyInstance) {
  app.addHook("preHandler", authMiddleware);
  app.addHook("preHandler", tenantMiddleware);
  app.addHook("preHandler", requireRole(["ADMIN"]));

  app.get("/users", listUsersHandler);
  app.post("/users", createUserHandler);
  app.patch("/users/:userId/role", updateRoleHandler);
}

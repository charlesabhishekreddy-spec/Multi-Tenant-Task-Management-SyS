import { FastifyInstance } from "fastify";
import {
  createTaskHandler,
  deleteTaskHandler,
  listTasksHandler,
  updateTaskHandler
} from "../controllers/task.controller.js";
import { authMiddleware } from "../middleware/auth.middleware.js";
import { tenantMiddleware } from "../middleware/tenant.middleware.js";
import { requireRole } from "../middleware/rbac.middleware.js";

export async function taskRoutes(app: FastifyInstance) {
  app.addHook("preHandler", authMiddleware);
  app.addHook("preHandler", tenantMiddleware);
  app.addHook("preHandler", requireRole(["ADMIN", "MEMBER"]));

  app.post("/tasks", createTaskHandler);
  app.get("/tasks", listTasksHandler);
  app.patch("/tasks/:taskId", updateTaskHandler);
  app.delete("/tasks/:taskId", deleteTaskHandler);
}

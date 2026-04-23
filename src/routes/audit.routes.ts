import { FastifyInstance } from "fastify";
import { listAuditLogsHandler } from "../controllers/audit.controller.js";
import { authMiddleware } from "../middleware/auth.middleware.js";
import { requireRole } from "../middleware/rbac.middleware.js";
import { tenantMiddleware } from "../middleware/tenant.middleware.js";

export async function auditRoutes(app: FastifyInstance) {
  app.addHook("preHandler", authMiddleware);
  app.addHook("preHandler", tenantMiddleware);
  app.addHook("preHandler", requireRole(["ADMIN"]));

  app.get("/audit-logs", listAuditLogsHandler);
}

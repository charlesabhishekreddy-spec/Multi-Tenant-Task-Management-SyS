import { FastifyInstance } from "fastify";

export async function logTaskAudit(
  app: FastifyInstance,
  input: {
    organizationId: string;
    performedBy: string;
    actionType: "TASK_CREATED" | "TASK_UPDATED" | "TASK_DELETED";
    taskId: string;
    changes?: Record<string, unknown>;
  }
) {
  await app.prisma.auditLog.create({
    data: {
      organizationId: input.organizationId,
      performedBy: input.performedBy,
      actionType: input.actionType,
      taskId: input.taskId,
      changes: input.changes
    }
  });
}

import { FastifyInstance } from "fastify";
import { Prisma, TaskStatus } from "@prisma/client";
import { canManageTask } from "../middleware/ownership.middleware.js";
import { AppError } from "../utils/errors.js";
import { toPagination } from "../utils/pagination.js";
import { logTaskAudit } from "./audit.service.js";

type AuthContext = {
  userId: string;
  organizationId: string;
  role: "ADMIN" | "MEMBER";
};

export async function createTask(
  app: FastifyInstance,
  auth: AuthContext,
  input: {
    title: string;
    description?: string;
    status?: TaskStatus;
    assignedTo?: string;
    priority?: number;
    deadline?: string;
  }
) {
  if (input.assignedTo) {
    const assignee = await app.prisma.user.findFirst({
      where: {
        id: input.assignedTo,
        organizationId: auth.organizationId
      }
    });

    if (!assignee) {
      throw new AppError("Assigned user not found in organization", 400);
    }
  }

  const task = await app.prisma.task.create({
    data: {
      organizationId: auth.organizationId,
      title: input.title,
      description: input.description,
      status: input.status ?? TaskStatus.TODO,
      createdBy: auth.userId,
      assignedTo: input.assignedTo,
      priority: input.priority,
      deadline: input.deadline ? new Date(input.deadline) : undefined
    }
  });

  await logTaskAudit(app, {
    organizationId: auth.organizationId,
    performedBy: auth.userId,
    actionType: "TASK_CREATED",
    taskId: task.id,
    changes: { after: task }
  });

  return task;
}

export async function listTasks(
  app: FastifyInstance,
  auth: AuthContext,
  query: {
    page?: number;
    limit?: number;
    status?: TaskStatus;
  }
) {
  const pagination = toPagination(query);

  const where: Prisma.TaskWhereInput = {
    organizationId: auth.organizationId,
    ...(query.status ? { status: query.status } : {}),
    ...(auth.role === "ADMIN"
      ? {}
      : {
          OR: [{ createdBy: auth.userId }, { assignedTo: auth.userId }]
        })
  };

  const [items, total] = await Promise.all([
    app.prisma.task.findMany({
      where,
      skip: pagination.skip,
      take: pagination.take,
      orderBy: { createdAt: "desc" }
    }),
    app.prisma.task.count({ where })
  ]);

  return {
    items,
    total,
    page: pagination.page,
    limit: pagination.limit
  };
}

export async function updateTask(
  app: FastifyInstance,
  auth: AuthContext,
  taskId: string,
  input: {
    title?: string;
    description?: string;
    status?: TaskStatus;
    assignedTo?: string | null;
    priority?: number | null;
    deadline?: string | null;
  }
) {
  const task = await app.prisma.task.findFirst({
    where: {
      id: taskId,
      organizationId: auth.organizationId
    }
  });

  if (!task) {
    throw new AppError("Task not found", 404);
  }

  if (!canManageTask(auth.role, auth.userId, task.createdBy)) {
    throw new AppError("Forbidden", 403);
  }

  if (input.assignedTo) {
    const assignee = await app.prisma.user.findFirst({
      where: {
        id: input.assignedTo,
        organizationId: auth.organizationId
      }
    });

    if (!assignee) {
      throw new AppError("Assigned user not found in organization", 400);
    }
  }

  const updated = await app.prisma.task.update({
    where: { id: task.id },
    data: {
      title: input.title,
      description: input.description,
      status: input.status,
      assignedTo: input.assignedTo ?? undefined,
      priority: input.priority ?? undefined,
      deadline: input.deadline ? new Date(input.deadline) : input.deadline === null ? null : undefined
    }
  });

  await logTaskAudit(app, {
    organizationId: auth.organizationId,
    performedBy: auth.userId,
    actionType: "TASK_UPDATED",
    taskId: task.id,
    changes: { before: task, after: updated }
  });

  return updated;
}

export async function deleteTask(app: FastifyInstance, auth: AuthContext, taskId: string) {
  const task = await app.prisma.task.findFirst({
    where: {
      id: taskId,
      organizationId: auth.organizationId
    }
  });

  if (!task) {
    throw new AppError("Task not found", 404);
  }

  if (!canManageTask(auth.role, auth.userId, task.createdBy)) {
    throw new AppError("Forbidden", 403);
  }

  await app.prisma.task.delete({ where: { id: task.id } });

  await logTaskAudit(app, {
    organizationId: auth.organizationId,
    performedBy: auth.userId,
    actionType: "TASK_DELETED",
    taskId: task.id,
    changes: { before: task }
  });
}

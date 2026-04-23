import { FastifyReply, FastifyRequest } from "fastify";
import { z } from "zod";
import { createTask, deleteTask, listTasks, updateTask } from "../services/task.service.js";

const taskStatusEnum = z.enum(["TODO", "IN_PROGRESS", "DONE"]);

const createTaskSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  status: taskStatusEnum.optional(),
  assignedTo: z.string().optional(),
  priority: z.number().int().min(1).max(5).optional(),
  deadline: z.string().datetime().optional()
});

const updateTaskSchema = z.object({
  title: z.string().min(1).optional(),
  description: z.string().optional(),
  status: taskStatusEnum.optional(),
  assignedTo: z.string().nullable().optional(),
  priority: z.number().int().min(1).max(5).nullable().optional(),
  deadline: z.string().datetime().nullable().optional()
});

const listQuerySchema = z.object({
  page: z.coerce.number().optional(),
  limit: z.coerce.number().optional(),
  status: taskStatusEnum.optional()
});

type CreateTaskBody = z.infer<typeof createTaskSchema>;
type UpdateTaskBody = z.infer<typeof updateTaskSchema>;
type ListTasksQuery = z.infer<typeof listQuerySchema>;

export async function createTaskHandler(
  request: FastifyRequest<{ Body: CreateTaskBody }>,
  reply: FastifyReply
) {
  const body = createTaskSchema.parse(request.body);
  const task = await createTask(request.server, request.auth, body);
  return reply.code(201).send(task);
}

export async function listTasksHandler(
  request: FastifyRequest<{ Querystring: ListTasksQuery }>,
  reply: FastifyReply
) {
  const query = listQuerySchema.parse(request.query);
  const result = await listTasks(request.server, request.auth, query);
  return reply.send(result);
}

export async function updateTaskHandler(
  request: FastifyRequest<{ Params: { taskId: string }; Body: UpdateTaskBody }>,
  reply: FastifyReply
) {
  const body = updateTaskSchema.parse(request.body);
  const task = await updateTask(request.server, request.auth, request.params.taskId, body);
  return reply.send(task);
}

export async function deleteTaskHandler(
  request: FastifyRequest<{ Params: { taskId: string } }>,
  reply: FastifyReply
) {
  await deleteTask(request.server, request.auth, request.params.taskId);
  return reply.code(204).send();
}

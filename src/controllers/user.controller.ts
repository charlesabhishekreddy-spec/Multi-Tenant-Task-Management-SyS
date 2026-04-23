import { FastifyReply, FastifyRequest } from "fastify";
import { z } from "zod";
import { createUser, listUsers, updateUserRole } from "../services/user.service.js";

const roleEnum = z.enum(["ADMIN", "MEMBER"]);

const createUserSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  role: roleEnum.default("MEMBER"),
  password: z.string().min(8)
});

const updateRoleSchema = z.object({
  role: roleEnum
});

type CreateUserBody = z.infer<typeof createUserSchema>;
type UpdateRoleBody = z.infer<typeof updateRoleSchema>;

export async function listUsersHandler(request: FastifyRequest, reply: FastifyReply) {
  const users = await listUsers(request.server, request.auth.organizationId);
  return reply.send({ items: users });
}

export async function createUserHandler(
  request: FastifyRequest<{ Body: CreateUserBody }>,
  reply: FastifyReply
) {
  const body = createUserSchema.parse(request.body);
  const user = await createUser(request.server, request.auth.organizationId, body);
  return reply.code(201).send(user);
}

export async function updateRoleHandler(
  request: FastifyRequest<{ Params: { userId: string }; Body: UpdateRoleBody }>,
  reply: FastifyReply
) {
  const body = updateRoleSchema.parse(request.body);
  const user = await updateUserRole(
    request.server,
    request.auth.organizationId,
    request.params.userId,
    body.role
  );
  return reply.send(user);
}

import { FastifyInstance } from "fastify";
import { Role } from "@prisma/client";
import { AppError } from "../utils/errors.js";
import { hashPassword } from "../utils/password.js";

export async function listUsers(app: FastifyInstance, organizationId: string) {
  return app.prisma.user.findMany({
    where: { organizationId },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      createdAt: true,
      updatedAt: true
    },
    orderBy: { createdAt: "desc" }
  });
}

export async function createUser(
  app: FastifyInstance,
  organizationId: string,
  input: {
    name: string;
    email: string;
    role: Role;
    password: string;
  }
) {
  const passwordHash = await hashPassword(input.password);

  return app.prisma.user.create({
    data: {
      organizationId,
      name: input.name,
      email: input.email.toLowerCase(),
      role: input.role,
      passwordHash
    },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      createdAt: true,
      updatedAt: true
    }
  });
}

export async function updateUserRole(
  app: FastifyInstance,
  organizationId: string,
  userId: string,
  role: Role
) {
  const existing = await app.prisma.user.findFirst({
    where: {
      id: userId,
      organizationId
    }
  });

  if (!existing) {
    throw new AppError("User not found", 404);
  }

  return app.prisma.user.update({
    where: { id: userId },
    data: { role },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      createdAt: true,
      updatedAt: true
    }
  });
}

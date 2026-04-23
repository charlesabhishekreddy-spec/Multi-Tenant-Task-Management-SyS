import { FastifyReply, FastifyRequest } from "fastify";

export function requireRole(allowedRoles: Array<"ADMIN" | "MEMBER">) {
  return async (request: FastifyRequest, reply: FastifyReply) => {
    if (!request.auth || !allowedRoles.includes(request.auth.role)) {
      return reply.code(403).send({ message: "Forbidden" });
    }
  };
}

export function isAdmin(role: "ADMIN" | "MEMBER") {
  return role === "ADMIN";
}

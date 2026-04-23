import { FastifyReply, FastifyRequest } from "fastify";

export async function tenantMiddleware(request: FastifyRequest, reply: FastifyReply) {
  if (!request.auth?.organizationId) {
    return reply.code(403).send({ message: "Tenant context missing" });
  }
}

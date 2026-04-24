import { FastifyReply, FastifyRequest } from "fastify";
import { z } from "zod";

const querySchema = z.object({
  page: z.coerce.number().optional(),
  limit: z.coerce.number().optional()
});

export async function listAuditLogsHandler(request: FastifyRequest, reply: FastifyReply) {
  const query = querySchema.parse(request.query);

  const page = Math.max(1, query.page ?? 1);
  const limit = Math.min(100, Math.max(1, query.limit ?? 20));
  const skip = (page - 1) * limit;

  const where = { organizationId: request.auth.organizationId };
  const [items, total] = await Promise.all([
    request.server.prisma.auditLog.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: "desc" },
      include: {
        performer: {
          select: { id: true, email: true, name: true }
        }
      }
    }),
    request.server.prisma.auditLog.count({ where })
  ]);

  return reply.send({
    items: items.map((item) => ({
      ...item,
      performedBy: {
        id: item.performer.id,
        email: item.performer.email,
        name: item.performer.name
      }
    })),
    total,
    page,
    limit
  });
}

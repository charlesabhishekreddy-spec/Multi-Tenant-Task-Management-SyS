import { FastifyReply, FastifyRequest } from "fastify";
import { AppError } from "../utils/errors.js";

export async function authMiddleware(request: FastifyRequest, reply: FastifyReply) {
  try {
    await request.jwtVerify<{
      userId: string;
      organizationId: string;
      role: "ADMIN" | "MEMBER";
      tokenType?: "access" | "refresh";
    }>();

    if (!request.user || typeof request.user !== "object") {
      throw new AppError("Invalid token payload", 401);
    }

    const user = request.user as {
      userId: string;
      organizationId: string;
      role: "ADMIN" | "MEMBER";
      tokenType?: "access" | "refresh";
    };

    if (user.tokenType && user.tokenType !== "access") {
      throw new AppError("Invalid token type", 401);
    }

    request.auth = {
      userId: user.userId,
      organizationId: user.organizationId,
      role: user.role
    };
  } catch {
    return reply.code(401).send({ message: "Unauthorized" });
  }
}

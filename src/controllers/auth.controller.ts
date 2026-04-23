import { FastifyReply, FastifyRequest } from "fastify";
import { z } from "zod";
import {
  bootstrapOrganizationAdmin,
  loginWithGoogle,
  loginWithPassword,
  refreshAccessToken,
  registerWithPassword,
  signTokens
} from "../services/auth.service.js";

const registerSchema = z.object({
  organizationSlug: z.string().min(2),
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(8)
});

const loginSchema = z.object({
  organizationSlug: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(8)
});

const googleSchema = z.object({
  organizationSlug: z.string().min(2),
  idToken: z.string().min(1)
});

const refreshSchema = z.object({
  refreshToken: z.string().min(1)
});

const bootstrapSchema = z.object({
  organizationName: z.string().min(2),
  organizationSlug: z.string().min(2),
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(8)
});

type RegisterBody = z.infer<typeof registerSchema>;
type LoginBody = z.infer<typeof loginSchema>;
type GoogleBody = z.infer<typeof googleSchema>;
type RefreshBody = z.infer<typeof refreshSchema>;
type BootstrapBody = z.infer<typeof bootstrapSchema>;

export async function bootstrapAdminHandler(
  request: FastifyRequest<{ Body: BootstrapBody }>,
  reply: FastifyReply
) {
  const body = bootstrapSchema.parse(request.body);
  const user = await bootstrapOrganizationAdmin(request.server, body);
  const tokens = signTokens(request.server, {
    userId: user.id,
    organizationId: user.organizationId,
    role: user.role
  });

  return reply.code(201).send({ user, ...tokens });
}

export async function registerHandler(
  request: FastifyRequest<{ Body: RegisterBody }>,
  reply: FastifyReply
) {
  const body = registerSchema.parse(request.body);
  const user = await registerWithPassword(request.server, body);

  const tokens = signTokens(request.server, {
    userId: user.id,
    organizationId: user.organizationId,
    role: user.role
  });

  return reply.code(201).send({ user, ...tokens });
}

export async function loginHandler(
  request: FastifyRequest<{ Body: LoginBody }>,
  reply: FastifyReply
) {
  const body = loginSchema.parse(request.body);
  const user = await loginWithPassword(request.server, body);
  const tokens = signTokens(request.server, {
    userId: user.id,
    organizationId: user.organizationId,
    role: user.role
  });

  return reply.send({ user, ...tokens });
}

export async function googleLoginHandler(
  request: FastifyRequest<{ Body: GoogleBody }>,
  reply: FastifyReply
) {
  const body = googleSchema.parse(request.body);
  const user = await loginWithGoogle(request.server, body);
  const tokens = signTokens(request.server, {
    userId: user.id,
    organizationId: user.organizationId,
    role: user.role
  });

  return reply.send({ user, ...tokens });
}

export async function refreshTokenHandler(
  request: FastifyRequest<{ Body: RefreshBody }>,
  reply: FastifyReply
) {
  const body = refreshSchema.parse(request.body);
  const tokens = await refreshAccessToken(request.server, body.refreshToken);
  return reply.send(tokens);
}

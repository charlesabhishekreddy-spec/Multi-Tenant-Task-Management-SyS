import { FastifyInstance } from "fastify";
import { OAuth2Client } from "google-auth-library";
import { Role } from "@prisma/client";
import jwt from "jsonwebtoken";
import { env } from "../config/env.js";
import { AppError } from "../utils/errors.js";
import { comparePassword, hashPassword } from "../utils/password.js";

const googleClient = new OAuth2Client(env.GOOGLE_CLIENT_ID);

export async function registerWithPassword(
  app: FastifyInstance,
  input: {
    organizationSlug: string;
    name: string;
    email: string;
    password: string;
  }
) {
  const organization = await app.prisma.organization.findUnique({
    where: { slug: input.organizationSlug }
  });

  if (!organization) {
    throw new AppError("Organization not found", 404);
  }

  const passwordHash = await hashPassword(input.password);

  const user = await app.prisma.user.create({
    data: {
      organizationId: organization.id,
      name: input.name,
      email: input.email.toLowerCase(),
      passwordHash,
      role: Role.MEMBER
    }
  });

  return user;
}

export async function bootstrapOrganizationAdmin(
  app: FastifyInstance,
  input: {
    organizationName: string;
    organizationSlug: string;
    name: string;
    email: string;
    password: string;
  }
) {
  const existing = await app.prisma.organization.findUnique({
    where: { slug: input.organizationSlug }
  });

  if (existing) {
    throw new AppError("Organization slug already exists", 409);
  }

  const passwordHash = await hashPassword(input.password);

  const organization = await app.prisma.organization.create({
    data: {
      name: input.organizationName,
      slug: input.organizationSlug,
      users: {
        create: {
          name: input.name,
          email: input.email.toLowerCase(),
          passwordHash,
          role: Role.ADMIN
        }
      }
    },
    include: {
      users: true
    }
  });

  return organization.users[0];
}

export async function loginWithPassword(
  app: FastifyInstance,
  input: {
    organizationSlug: string;
    email: string;
    password: string;
  }
) {
  const organization = await app.prisma.organization.findUnique({
    where: { slug: input.organizationSlug }
  });

  if (!organization) {
    throw new AppError("Invalid credentials", 401);
  }

  const user = await app.prisma.user.findUnique({
    where: {
      organizationId_email: {
        organizationId: organization.id,
        email: input.email.toLowerCase()
      }
    }
  });

  if (!user?.passwordHash) {
    throw new AppError("Invalid credentials", 401);
  }

  const ok = await comparePassword(input.password, user.passwordHash);
  if (!ok) {
    throw new AppError("Invalid credentials", 401);
  }

  return user;
}

export async function loginWithGoogle(
  app: FastifyInstance,
  input: {
    organizationSlug: string;
    idToken: string;
  }
) {
  if (!env.GOOGLE_CLIENT_ID) {
    throw new AppError("Google OAuth is not configured", 400);
  }

  const ticket = await googleClient.verifyIdToken({
    idToken: input.idToken,
    audience: env.GOOGLE_CLIENT_ID
  });

  const payload = ticket.getPayload();
  if (!payload?.sub || !payload.email) {
    throw new AppError("Invalid Google token", 401);
  }

  const organization = await app.prisma.organization.findUnique({
    where: { slug: input.organizationSlug }
  });

  if (!organization) {
    throw new AppError("Organization not found", 404);
  }

  const email = payload.email.toLowerCase();

  const existing = await app.prisma.user.findFirst({
    where: {
      organizationId: organization.id,
      email
    }
  });

  if (existing) {
    return existing;
  }

  if (!env.AUTO_PROVISION_OAUTH_USERS) {
    throw new AppError("User not provisioned", 403);
  }

  return app.prisma.user.create({
    data: {
      organizationId: organization.id,
      email,
      name: payload.name || email,
      role: Role.MEMBER,
      oauthProvider: "google",
      oauthSubject: payload.sub
    }
  });
}

export function signTokens(
  app: FastifyInstance,
  input: {
    userId: string;
    organizationId: string;
    role: Role;
  }
) {
  const accessToken = app.jwt.sign(
    {
      userId: input.userId,
      organizationId: input.organizationId,
      role: input.role,
      tokenType: "access"
    },
    {
      expiresIn: env.ACCESS_TOKEN_TTL
    }
  );

  const refreshToken = jwt.sign(
    {
      userId: input.userId,
      organizationId: input.organizationId,
      role: input.role,
      tokenType: "refresh"
    },
    env.JWT_REFRESH_SECRET,
    {
      expiresIn: env.REFRESH_TOKEN_TTL as jwt.SignOptions["expiresIn"]
    }
  );

  return { accessToken, refreshToken };
}

export async function refreshAccessToken(
  app: FastifyInstance,
  refreshToken: string
) {
  const payload = jwt.verify(refreshToken, env.JWT_REFRESH_SECRET) as {
    userId: string;
    organizationId: string;
    role: Role;
    tokenType: "refresh";
  };

  if (payload.tokenType !== "refresh") {
    throw new AppError("Invalid refresh token", 401);
  }

  const user = await app.prisma.user.findFirst({
    where: {
      id: payload.userId,
      organizationId: payload.organizationId
    }
  });

  if (!user) {
    throw new AppError("Invalid refresh token", 401);
  }

  return signTokens(app, {
    userId: user.id,
    organizationId: user.organizationId,
    role: user.role
  });
}

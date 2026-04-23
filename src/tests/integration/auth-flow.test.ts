import { beforeEach, describe, expect, it } from "vitest";
import { Role } from "@prisma/client";
import { createMockApp } from "../helpers/mock-app.js";

describe("Auth flow integration", () => {
  beforeEach(() => {
    process.env.JWT_ACCESS_SECRET = "test_access_secret_123456";
    process.env.JWT_REFRESH_SECRET = "test_refresh_secret_123456";
    process.env.ACCESS_TOKEN_TTL = "15m";
    process.env.REFRESH_TOKEN_TTL = "7d";
    process.env.DATABASE_URL = "postgresql://test:test@localhost:5432/test";
  });

  it("bootstraps org admin, registers member, logs in, and refreshes token", async () => {
    const {
      bootstrapOrganizationAdmin,
      loginWithPassword,
      refreshAccessToken,
      registerWithPassword,
      signTokens
    } = await import("../../services/auth.service.js");

    const app = createMockApp() as unknown as Parameters<typeof bootstrapOrganizationAdmin>[0];

    const admin = await bootstrapOrganizationAdmin(app, {
      organizationName: "Org One",
      organizationSlug: "org-one",
      name: "Admin",
      email: "admin@org.com",
      password: "Password123!"
    });

    expect(admin.role).toBe(Role.ADMIN);

    const member = await registerWithPassword(app, {
      organizationSlug: "org-one",
      name: "Member",
      email: "member@org.com",
      password: "Password123!"
    });

    expect(member.organizationId).toBe(admin.organizationId);

    const loginUser = await loginWithPassword(app, {
      organizationSlug: "org-one",
      email: "member@org.com",
      password: "Password123!"
    });

    const tokens = signTokens(app, {
      userId: loginUser.id,
      organizationId: loginUser.organizationId,
      role: loginUser.role
    });

    expect(tokens.accessToken).toBeTruthy();
    expect(tokens.refreshToken).toBeTruthy();

    const refreshed = await refreshAccessToken(app, tokens.refreshToken);
    expect(refreshed.accessToken).toBeTruthy();
  });
});

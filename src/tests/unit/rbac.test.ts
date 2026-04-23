import { describe, expect, it } from "vitest";
import { isAdmin, requireRole } from "../../middleware/rbac.middleware.js";

describe("RBAC helpers", () => {
  it("isAdmin returns true for ADMIN", () => {
    expect(isAdmin("ADMIN")).toBe(true);
  });

  it("isAdmin returns false for MEMBER", () => {
    expect(isAdmin("MEMBER")).toBe(false);
  });

  it("requireRole blocks unauthorized roles", async () => {
    const guard = requireRole(["ADMIN"]);

    let statusCode = 200;
    let payload: unknown;

    const request = {
      auth: {
        role: "MEMBER"
      }
    } as unknown as Parameters<typeof guard>[0];

    const reply = {
      code(code: number) {
        statusCode = code;
        return this;
      },
      send(body: unknown) {
        payload = body;
        return this;
      }
    } as unknown as Parameters<typeof guard>[1];

    await guard(request, reply);

    expect(statusCode).toBe(403);
    expect(payload).toEqual({ message: "Forbidden" });
  });
});

import { describe, expect, it } from "vitest";
import { Role } from "@prisma/client";
import { createMockApp } from "../helpers/mock-app.js";

describe("Task CRUD with role and tenant isolation", () => {
  it("enforces own-task rule for members and full access for admins", async () => {
    process.env.JWT_ACCESS_SECRET = "test_access_secret_123456";
    process.env.JWT_REFRESH_SECRET = "test_refresh_secret_123456";
    process.env.ACCESS_TOKEN_TTL = "15m";
    process.env.REFRESH_TOKEN_TTL = "7d";
    process.env.DATABASE_URL = "postgresql://test:test@localhost:5432/test";

    const { bootstrapOrganizationAdmin, registerWithPassword } = await import(
      "../../services/auth.service.js"
    );
    const { createTask, deleteTask, listTasks, updateTask } = await import(
      "../../services/task.service.js"
    );

    const app = createMockApp() as unknown as Parameters<typeof bootstrapOrganizationAdmin>[0];

    const admin = await bootstrapOrganizationAdmin(app, {
      organizationName: "Org A",
      organizationSlug: "org-a",
      name: "Admin",
      email: "admin@a.com",
      password: "Password123!"
    });

    const memberA = await registerWithPassword(app, {
      organizationSlug: "org-a",
      name: "Member A",
      email: "member-a@a.com",
      password: "Password123!"
    });

    await bootstrapOrganizationAdmin(app, {
      organizationName: "Org B",
      organizationSlug: "org-b",
      name: "Admin B",
      email: "admin@b.com",
      password: "Password123!"
    });

    const memberB = await registerWithPassword(app, {
      organizationSlug: "org-b",
      name: "Member B",
      email: "member-b@b.com",
      password: "Password123!"
    });

    const taskA = await createTask(
      app,
      { userId: memberA.id, organizationId: memberA.organizationId, role: Role.MEMBER },
      { title: "Tenant A task" }
    );

    const taskB = await createTask(
      app,
      { userId: memberB.id, organizationId: memberB.organizationId, role: Role.MEMBER },
      { title: "Tenant B task" }
    );

    const memberAList = await listTasks(
      app,
      { userId: memberA.id, organizationId: memberA.organizationId, role: Role.MEMBER },
      {}
    );

    expect(memberAList.items.map((t) => t.id)).toContain(taskA.id);
    expect(memberAList.items.map((t) => t.id)).not.toContain(taskB.id);

    await expect(
      updateTask(
        app,
        { userId: memberA.id, organizationId: memberA.organizationId, role: Role.MEMBER },
        taskA.id,
        { title: "Updated by owner" }
      )
    ).resolves.toBeTruthy();

    await expect(
      deleteTask(
        app,
        { userId: memberA.id, organizationId: memberA.organizationId, role: Role.MEMBER },
        taskB.id
      )
    ).rejects.toThrow();

    await expect(
      deleteTask(
        app,
        { userId: admin.id, organizationId: admin.organizationId, role: Role.ADMIN },
        taskA.id
      )
    ).resolves.toBeUndefined();
  });
});

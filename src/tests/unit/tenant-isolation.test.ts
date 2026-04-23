import { describe, expect, it } from "vitest";
import { TaskStatus } from "@prisma/client";
import { listTasks } from "../../services/task.service.js";

describe("Tenant isolation in task listing", () => {
  it("always filters by organizationId", async () => {
    let whereArg: unknown;

    const app = {
      prisma: {
        task: {
          findMany(args: { where: unknown }) {
            whereArg = args.where;
            return [];
          },
          count() {
            return 0;
          }
        }
      }
    } as unknown as Parameters<typeof listTasks>[0];

    await listTasks(
      app,
      { userId: "u1", organizationId: "org-1", role: "MEMBER" },
      { status: TaskStatus.TODO, page: 1, limit: 10 }
    );

    expect(whereArg).toMatchObject({ organizationId: "org-1", status: "TODO" });
  });
});

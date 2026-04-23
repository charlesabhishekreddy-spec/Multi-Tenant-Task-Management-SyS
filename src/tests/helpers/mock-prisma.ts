import { Role, TaskStatus } from "@prisma/client";

type Organization = { id: string; slug: string; name: string };
type User = {
  id: string;
  organizationId: string;
  email: string;
  name: string;
  role: Role;
  passwordHash?: string | null;
  oauthProvider?: string | null;
  oauthSubject?: string | null;
};
type Task = {
  id: string;
  organizationId: string;
  title: string;
  description?: string | null;
  status: TaskStatus;
  createdBy: string;
  assignedTo?: string | null;
  priority?: number | null;
  deadline?: Date | null;
  createdAt: Date;
  updatedAt: Date;
};
type AuditLog = {
  id: string;
  organizationId: string;
  actionType: string;
  performedBy: string;
  taskId?: string | null;
  changes?: Record<string, unknown>;
  createdAt: Date;
};

let idCounter = 1;
function nextId() {
  const id = `id-${idCounter}`;
  idCounter += 1;
  return id;
}

export function createMockPrisma() {
  const organizations: Organization[] = [];
  const users: User[] = [];
  const tasks: Task[] = [];
  const auditLogs: AuditLog[] = [];

  return {
    __data: { organizations, users, tasks, auditLogs },
    organization: {
      async findUnique(args: { where: { slug: string } }) {
        return organizations.find((o) => o.slug === args.where.slug) ?? null;
      },
      async create(args: {
        data: {
          name: string;
          slug: string;
          users?: { create: { name: string; email: string; passwordHash: string; role: Role } };
        };
        include?: { users?: boolean };
      }) {
        const org: Organization = { id: nextId(), name: args.data.name, slug: args.data.slug };
        organizations.push(org);

        if (args.data.users?.create) {
          const u = args.data.users.create;
          users.push({
            id: nextId(),
            organizationId: org.id,
            name: u.name,
            email: u.email,
            passwordHash: u.passwordHash,
            role: u.role
          });
        }

        if (args.include?.users) {
          return { ...org, users: users.filter((u) => u.organizationId === org.id) };
        }

        return org;
      },
      async upsert(args: {
        where: { slug: string };
        create: { name: string; slug: string };
      }) {
        const found = organizations.find((o) => o.slug === args.where.slug);
        if (found) {
          return found;
        }

        const org = { id: nextId(), name: args.create.name, slug: args.create.slug };
        organizations.push(org);
        return org;
      }
    },
    user: {
      async findUnique(args: { where: { organizationId_email: { organizationId: string; email: string } } }) {
        const key = args.where.organizationId_email;
        return (
          users.find((u) => u.organizationId === key.organizationId && u.email === key.email) ?? null
        );
      },
      async findFirst(args: { where: Record<string, unknown> }) {
        return (
          users.find((u) => {
            for (const [key, value] of Object.entries(args.where)) {
              if ((u as unknown as Record<string, unknown>)[key] !== value) {
                return false;
              }
            }
            return true;
          }) ?? null
        );
      },
      async findMany(args: { where: { organizationId: string } }) {
        return users.filter((u) => u.organizationId === args.where.organizationId);
      },
      async create(args: { data: Omit<User, "id"> }) {
        const user = { id: nextId(), ...args.data };
        users.push(user);
        return user;
      },
      async update(args: { where: { id: string }; data: Partial<User> }) {
        const idx = users.findIndex((u) => u.id === args.where.id);
        users[idx] = { ...users[idx], ...args.data };
        return users[idx];
      },
      async upsert(args: {
        where: { organizationId_email: { organizationId: string; email: string } };
        create: Omit<User, "id">;
      }) {
        const found = await this.findUnique({ where: args.where });
        if (found) {
          return found;
        }

        return this.create({ data: args.create });
      }
    },
    task: {
      async create(args: { data: Omit<Task, "id" | "createdAt" | "updatedAt"> }) {
        const task: Task = {
          id: nextId(),
          createdAt: new Date(),
          updatedAt: new Date(),
          ...args.data
        };
        tasks.push(task);
        return task;
      },
      async findFirst(args: { where: Record<string, unknown> }) {
        return (
          tasks.find((t) => {
            for (const [key, value] of Object.entries(args.where)) {
              if ((t as unknown as Record<string, unknown>)[key] !== value) {
                return false;
              }
            }
            return true;
          }) ?? null
        );
      },
      async findMany(args: {
        where: { organizationId: string; status?: TaskStatus; OR?: Array<{ createdBy?: string; assignedTo?: string }> };
      }) {
        return tasks.filter((t) => {
          if (t.organizationId !== args.where.organizationId) return false;
          if (args.where.status && t.status !== args.where.status) return false;
          if (args.where.OR) {
            return args.where.OR.some((o) =>
              Object.entries(o).every(
                ([key, value]) => (t as unknown as Record<string, unknown>)[key] === value
              )
            );
          }
          return true;
        });
      },
      async count(args: { where: { organizationId: string } }) {
        return tasks.filter((t) => t.organizationId === args.where.organizationId).length;
      },
      async update(args: { where: { id: string }; data: Partial<Task> }) {
        const idx = tasks.findIndex((t) => t.id === args.where.id);
        tasks[idx] = { ...tasks[idx], ...args.data, updatedAt: new Date() };
        return tasks[idx];
      },
      async delete(args: { where: { id: string } }) {
        const idx = tasks.findIndex((t) => t.id === args.where.id);
        const [removed] = tasks.splice(idx, 1);
        return removed;
      }
    },
    auditLog: {
      async create(args: {
        data: {
          organizationId: string;
          actionType: string;
          performedBy: string;
          taskId?: string;
          changes?: Record<string, unknown>;
        };
      }) {
        const log: AuditLog = {
          id: nextId(),
          createdAt: new Date(),
          organizationId: args.data.organizationId,
          actionType: args.data.actionType,
          performedBy: args.data.performedBy,
          taskId: args.data.taskId,
          changes: args.data.changes
        };
        auditLogs.push(log);
        return log;
      },
      async findMany(args: { where: { organizationId: string } }) {
        return auditLogs.filter((l) => l.organizationId === args.where.organizationId);
      },
      async count(args: { where: { organizationId: string } }) {
        return auditLogs.filter((l) => l.organizationId === args.where.organizationId).length;
      }
    }
  };
}

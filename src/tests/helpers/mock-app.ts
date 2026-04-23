import jwt from "jsonwebtoken";
import { createMockPrisma } from "./mock-prisma.js";

export function createMockApp() {
  const prisma = createMockPrisma();
  const accessSecret = process.env.JWT_ACCESS_SECRET || "test_access_secret_123456";
  const refreshSecret = process.env.JWT_REFRESH_SECRET || "test_refresh_secret_123456";

  return {
    prisma,
    jwt: {
      sign(payload: Record<string, unknown>, options?: { expiresIn?: string; secret?: string }) {
        const secret = options?.secret ?? accessSecret;
        return jwt.sign(payload, secret, {
          expiresIn: (options?.expiresIn ?? "15m") as jwt.SignOptions["expiresIn"]
        });
      },
      verify(token: string, options?: { secret?: string }) {
        const secret = options?.secret ?? accessSecret;
        return jwt.verify(token, secret) as Record<string, unknown>;
      }
    }
  };
}

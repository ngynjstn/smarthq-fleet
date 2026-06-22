import "dotenv/config";
import { PrismaClient } from "@/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

// Postgres (Neon) driver adapter, pointed at the POOLED connection
// for short-lived serverless queries.
const adapter = new PrismaPg({ connectionString: process.env["DATABASE_URL"] });

//cache the client on global this so hot reload in dev doesnt open new connection pool everytome the file gets saved
const globalForPrisma = globalThis as unknown as {
    prisma: PrismaClient | undefined;
};

export const prisma =
    globalForPrisma.prisma ?? new PrismaClient({ adapter });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
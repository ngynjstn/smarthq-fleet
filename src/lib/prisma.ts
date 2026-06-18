import "dotenv/config";
import { PrismaClient } from "@/generated/prisma/client";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";


// this driver adapter is used for sqlite
// it wraps the better sqllite3 driver and points at our databaseurl

const adapter = new PrismaBetterSqlite3({
    url: process.env["DATABASE_URL"],
});

//cache the client on global this so hot reload in dev doesnt open new connection pool everytome the file gets saved
const globalForPrisma = globalThis as unknown as {
    prisma: PrismaClient | undefined;
};

export const prisma =
    globalForPrisma.prisma ?? new PrismaClient({ adapter });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
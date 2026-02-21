import { Pool } from 'pg'
import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient } from '@prisma/client'

const connectionString = process.env.DATABASE_URL || "postgresql://dummy:dummy@localhost:5432/dummy";

const pool = new Pool({ connectionString })
const adapter = new PrismaPg(pool)

const globalForPrismaV2 = globalThis as unknown as { prismaV2: PrismaClient };

export const db =
    globalForPrismaV2.prismaV2 ||
    new PrismaClient({
        adapter,
        log: ["query"],
    });

if (process.env.NODE_ENV !== "production") globalForPrismaV2.prismaV2 = db;

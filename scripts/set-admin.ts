import { Pool } from 'pg'
import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient } from '@prisma/client'
import dotenv from 'dotenv';
import path from 'path';

// Load .env from project root
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
    console.error("DATABASE_URL must be defined");
    process.exit(1);
}

const pool = new Pool({ connectionString })
const adapter = new PrismaPg(pool)
const db = new PrismaClient({ adapter })

async function main() {
    const email = 'dedi@gmail.com';
    console.log(`Updating user ${email}...`);
    try {
        const user = await db.user.update({
            where: { email },
            data: { role: 'ADMIN' },
        });
        console.log(`User ${user.email} updated to ${user.role}`);
    } catch (error) {
        console.error('Error updating user:', error);
    } finally {
        await db.$disconnect();
        // pool.end(); // If needed
    }
}

main();

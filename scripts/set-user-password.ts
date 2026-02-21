import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const db = new PrismaClient();

async function main() {
    const email = process.argv[2];
    const password = process.argv[3];

    if (!email || !password) {
        console.error("Usage: npx ts-node scripts/set-user-password.ts <email> <password>");
        process.exit(1);
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await db.user.update({
        where: { email },
        data: {
            password: hashedPassword,
        },
    });

    console.log(`Password updated for user: ${user.email}`);
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await db.$disconnect();
    });

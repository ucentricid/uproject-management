import "dotenv/config";
import { db } from "@/lib/db";

async function main() {
    try {
        console.log("Attempting to connect to database...");
        // Just run a simple query
        const userCount = await db.user.count();
        console.log(`Database connected successfully! User count: ${userCount}`);
    } catch (error) {
        console.error("Database connection failed:", error);
        process.exit(1);
    } finally {
        await db.$disconnect();
    }
}

main();

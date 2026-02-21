-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('OWNER', 'CLIENT');

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "role" "UserRole" NOT NULL DEFAULT 'CLIENT';

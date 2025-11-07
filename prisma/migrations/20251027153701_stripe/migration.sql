/*
  Warnings:

  - You are about to drop the `Clinic` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "public"."Clinic" DROP CONSTRAINT "Clinic_userId_fkey";

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "plan" TEXT NOT NULL DEFAULT 'Free',
ADD COLUMN     "role" TEXT NOT NULL DEFAULT 'Member',
ADD COLUMN     "stripeCustomerId" TEXT;

-- DropTable
DROP TABLE "public"."Clinic";

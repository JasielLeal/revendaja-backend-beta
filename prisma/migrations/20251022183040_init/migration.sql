/*
  Warnings:

  - You are about to drop the column `tokenAcess` on the `User` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "User" DROP COLUMN "tokenAcess",
ADD COLUMN     "tokenAccess" TEXT;

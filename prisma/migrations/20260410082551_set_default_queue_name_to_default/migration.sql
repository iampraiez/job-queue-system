/*
  Warnings:

  - You are about to drop the column `updatedAt` on the `Job` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Job" DROP COLUMN "updatedAt",
ALTER COLUMN "queueName" SET DEFAULT 'DEFAULT';

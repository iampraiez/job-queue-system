/*
  Warnings:

  - You are about to drop the column `type` on the `Job` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "Job_type_idx";

-- AlterTable
ALTER TABLE "Job" DROP COLUMN "type";

-- DropEnum
DROP TYPE "JobType";

-- CreateIndex
CREATE INDEX "Job_queueName_idx" ON "Job"("queueName");

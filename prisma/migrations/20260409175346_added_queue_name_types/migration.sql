/*
  Warnings:

  - Changed the type of `queueName` on the `Job` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- CreateEnum
CREATE TYPE "QueueType" AS ENUM ('DEFAULT', 'HIGH_PRIORITY', 'LOW_PRIORITY');

-- AlterTable
ALTER TABLE "Job" DROP COLUMN "queueName",
ADD COLUMN     "queueName" "QueueType" NOT NULL;

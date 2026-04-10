/*
  Warnings:

  - The values [DEFAULT] on the enum `QueueType` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "QueueType_new" AS ENUM ('EMAIL', 'IMAGE_PROCESSING', 'REPORT_GENERATION', 'SCRAPING');
ALTER TABLE "public"."Job" ALTER COLUMN "queueName" DROP DEFAULT;
ALTER TABLE "Job" ALTER COLUMN "queueName" TYPE "QueueType_new" USING ("queueName"::text::"QueueType_new");
ALTER TYPE "QueueType" RENAME TO "QueueType_old";
ALTER TYPE "QueueType_new" RENAME TO "QueueType";
DROP TYPE "public"."QueueType_old";
COMMIT;

-- AlterTable
ALTER TABLE "Job" ALTER COLUMN "queueName" DROP DEFAULT;

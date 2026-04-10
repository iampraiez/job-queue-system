/*
  Warnings:

  - A unique constraint covering the columns `[id]` on the table `Job` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "Job_id_key" ON "Job"("id");

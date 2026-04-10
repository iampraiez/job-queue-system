import { PrismaClient } from "../../../generated/prisma/client.js";
import { Queue } from "bullmq";
import { JobRequestBody } from "./jobs.parser.js";

export class JobService {
  constructor(
    private readonly prisma: PrismaClient,
    private readonly queues: Record<string, Queue>,
  ) {}

  async createJob(jobData: JobRequestBody) {
    const jobRecord = await this.prisma.job.create({
      data: {
        data: jobData.data as object,
        queueName: jobData.queueName,
        maxAttempts: jobData.maxAttempts,
        delayUntil: jobData.delayUntil,
        userId: jobData.userId,
      },
    });

    const targetQueue = this.getQueue(jobData.queueName);

    await targetQueue.add(
      jobData.queueName,
      {
        jobId: jobRecord.id,
        ...jobData.data,
      },
      {
        jobId: jobRecord.id,
        attempts: jobRecord.maxAttempts,
        delay: jobRecord.delayUntil
          ? Math.max(0, new Date(jobRecord.delayUntil).getTime() - Date.now())
          : 0,
      },
    );

    return jobRecord;
  }

  async getJob(id: string, userId: string) {
    return await this.prisma.job.findUnique({
      where: {
        id,
        userId,
      },
    });
  }

  async deleteJob(id: string, userId: string) {
    const job = await this.prisma.job.findUnique({
      where: {
        id,
        userId,
      },
    });

    if (!job) {
      throw new Error("Job not found");
    }

    if (job.status === "COMPLETED") {
      throw new Error("Job already completed");
    }

    const targetQueue = this.getQueue(job.queueName);
    await targetQueue.remove(id);

    return await this.prisma.job.delete({
      where: { id },
    });
  }

  private getQueue(queueName: string): Queue {
    const queueMap: Record<string, Queue> = {
      EMAIL: this.queues.email,
      IMAGE_PROCESSING: this.queues.imageProcessing,
      REPORT_GENERATION: this.queues.reportGeneration,
      SCRAPING: this.queues.scraping,
    };
    return queueMap[queueName];
  }
}

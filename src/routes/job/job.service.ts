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

    const queueMap: Record<string, Queue> = {
      EMAIL: this.queues.email,
      IMAGE_PROCESSING: this.queues.imageProcessing,
      REPORT_GENERATION: this.queues.reportGeneration,
      SCRAPING: this.queues.scraping,
    };
    const targetQueue = queueMap[jobData.queueName];

    await targetQueue.add(
      jobData.queueName,
      {
        jobId: jobRecord.id,
        ...jobData.data,
      },
      {
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
}

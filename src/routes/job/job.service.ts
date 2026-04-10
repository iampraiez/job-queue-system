import { PrismaClient } from "../../../generated/prisma/client.js";
import { Queue } from "bullmq";
import { JobRequestBody } from "./jobs.parser.js";

export class JobService {
  constructor(
    private readonly prisma: PrismaClient,
    private readonly queue: Queue,
  ) {}

  async createJob(jobData: JobRequestBody) {
    const jobRecord = await this.prisma.job.create({
      data: {
        type: jobData.type,
        data: jobData.data as object,
        queueName: jobData.queueName,
        maxAttempts: jobData.maxAttempts,
        delayUntil: jobData.delayUntil,
        userId: jobData.userId,
      },
    });

    await this.queue.add(
      jobData.type,
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

import * as z from "zod";

const QueueTypeEnum = z.enum([
  "EMAIL",
  "IMAGE_PROCESSING",
  "REPORT_GENERATION",
  "SCRAPING",
]);
type QueueType = z.infer<typeof QueueTypeEnum>;

interface EmailJobData {
  to: string;
  subject: string;
  body: string;
  from?: string;
  templateId?: string;
  variables?: Record<string, any>;
}

interface ImageProcessingJobData {
  imageUrl?: string;
  operations?: Array<{
    type: "resize" | "crop" | "compress" | "convert" | "watermark";
    params?: Record<string, any>; // width, height, quality, etc.
  }>;
  outputFormat?: "jpeg" | "png" | "webp";
  quality?: number;
}

interface ReportGenerationJobData {
  reportType: "daily" | "weekly" | "monthly" | "custom";
  filters?: Record<string, any>;
  format?: "pdf" | "csv" | "excel";
  emailTo?: string;
}

interface ScrapingJobData {
  url: string;
  selectors?: string[]; // CSS selectors to extract
  maxPages?: number;
  headers?: Record<string, string>;
}

export type JobRequestBody = {
  queueName: QueueType;
  maxAttempts?: number;
  delayUntil?: Date;
  userId: string;
} & (
  | { queueName: "EMAIL"; data: EmailJobData }
  | { queueName: "IMAGE_PROCESSING"; data: ImageProcessingJobData }
  | { queueName: "REPORT_GENERATION"; data: ReportGenerationJobData }
  | { queueName: "SCRAPING"; data: ScrapingJobData }
);

export const jobRequestBodySchema = z.discriminatedUnion("queueName", [
  z.object({
    queueName: z.literal("EMAIL"),
    maxAttempts: z.number().int().positive().optional(),
    delayUntil: z.date().optional(),
    userId: z.string(),
    data: z.object({
      to: z.string().email(),
      subject: z.string(),
      body: z.string(),
      from: z.string().email().optional(),
      templateId: z.string().optional(),
      variables: z.record(z.string(), z.unknown()).optional(),
    }),
  }),
  z.object({
    queueName: z.literal("IMAGE_PROCESSING"),
    maxAttempts: z.number().int().positive().optional(),
    delayUntil: z.date().optional(),
    userId: z.string(),
    data: z.object({
      imageUrl: z.string().url().optional(),
      operations: z
        .array(
          z.object({
            type: z.enum([
              "resize",
              "crop",
              "compress",
              "convert",
              "watermark",
            ] as const),
            params: z.record(z.string(), z.unknown()).optional(),
          }),
        )
        .optional(),
      outputFormat: z.enum(["jpeg", "png", "webp"] as const).optional(),
      quality: z.number().min(1).max(100).optional(),
    }),
  }),
  z.object({
    queueName: z.literal("REPORT_GENERATION"),
    maxAttempts: z.number().int().positive().optional(),
    delayUntil: z.date().optional(),
    userId: z.string(),
    data: z.object({
      reportType: z.enum(["daily", "weekly", "monthly", "custom"] as const),
      userId: z.string(),
      filters: z.record(z.string(), z.unknown()).optional(),
      format: z.enum(["pdf", "csv", "excel"] as const).optional(),
      emailTo: z.string().email().optional(),
    }),
  }),
  z.object({
    queueName: z.literal("SCRAPING"),
    maxAttempts: z.number().int().positive().optional(),
    delayUntil: z.date().optional(),
    userId: z.string(),
    data: z.object({
      url: z.string().url(),
      selectors: z.array(z.string()).optional(),
      maxPages: z.number().int().positive().optional(),
      headers: z.record(z.string(), z.string()).optional(),
    }),
  }),
]);

export type JobRequestBodySchema = z.infer<typeof jobRequestBodySchema>;

export type JobData =
  | EmailJobData
  | ImageProcessingJobData
  | ReportGenerationJobData
  | ScrapingJobData;

import * as z from "zod";

type JobType = "EMAIL" | "IMAGE_PROCESSING" | "REPORT_GENERATION" | "SCRAPING";
type QueueType = "DEFAULT" | "HIGH_PRIORITY" | "LOW_PRIORITY";

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
  type: JobType;
  queueName: QueueType;
  maxAttempts?: number;
  delayUntil?: Date;
  userId: string;
} & (
  | { type: "EMAIL"; data: EmailJobData }
  | { type: "IMAGE_PROCESSING"; data: ImageProcessingJobData }
  | { type: "REPORT_GENERATION"; data: ReportGenerationJobData }
  | { type: "SCRAPING"; data: ScrapingJobData }
);

export const jobRequestBodySchema = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("EMAIL"),
    queueName: z.enum(["DEFAULT", "HIGH_PRIORITY", "LOW_PRIORITY"]),
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
    type: z.literal("IMAGE_PROCESSING"),
    queueName: z.enum(["DEFAULT", "HIGH_PRIORITY", "LOW_PRIORITY"]),
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
      userId: z.string().optional(),
    }),
  }),
  z.object({
    type: z.literal("REPORT_GENERATION"),
    queueName: z.enum(["DEFAULT", "HIGH_PRIORITY", "LOW_PRIORITY"]),
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
    type: z.literal("SCRAPING"),
    queueName: z.enum(["DEFAULT", "HIGH_PRIORITY", "LOW_PRIORITY"]),
    maxAttempts: z.number().int().positive().optional(),
    delayUntil: z.date().optional(),
    userId: z.string(),
    data: z.object({
      url: z.string().url(),
      selectors: z.array(z.string()).optional(),
      maxPages: z.number().int().positive().optional(),
      headers: z.record(z.string(), z.string()).optional(),
      userId: z.string().optional(),
    }),
  }),
]);

export type JobRequestBodySchema = z.infer<typeof jobRequestBodySchema>;

export type JobData =
  | EmailJobData
  | ImageProcessingJobData
  | ReportGenerationJobData
  | ScrapingJobData;

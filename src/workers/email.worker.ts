import { Job } from "bullmq";

export default async function (job: Job) {
  const { to, subject, body } = job.data;

  console.log(
    `[Email Worker] Processing Job ${job.id} - Attempt ${job.attemptsMade + 1}/${job.opts.attempts}`,
  );
  console.log(
    `[Email Worker] Sending Email to: ${to} | Subject: ${subject} | Body size: ${body?.length}`,
  );

  const shouldFail = Math.random() < 0.4;

  await new Promise((resolve) => setTimeout(resolve, 5000));

  if (shouldFail) {
    throw new Error(
      "Network timeout while connecting to the SMTP server. BullMQ will retry this.",
    );
  }

  console.log(`[Email Worker] Successfully sent email for Job ${job.id}`);

  return {
    sentAt: new Date(),
    providerId: `msg_${Math.random().toString(36).substring(7)}`,
    status: "delivered",
  };
}

const queue = [];
let activeCount = 0;
const MAX_CONCURRENT = 3;

const processNext = () => {
  if (queue.length === 0 || activeCount >= MAX_CONCURRENT) return;
  const job = queue.shift();
  activeCount++;
  executeJob(job);
};

const executeJob = async (job) => {
  const maxAttempts = job.maxRetries ?? 2;
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      await job.handler();
      break;
    } catch (err) {
      console.error(`Job ${job.name} failed (attempt ${attempt}/${maxAttempts}):`, err.message);
      if (attempt < maxAttempts) {
        await new Promise((r) => setTimeout(r, 1000 * attempt));
      } else {
        console.error(`Job ${job.name} exhausted all ${maxAttempts} attempts.`);
        try {
          const { default: AuditLog } = await import("../models/AuditLog.js");
          await AuditLog.create({
            action: "job.failed",
            resource: "JobQueue",
            details: { jobName: job.name, error: err.message, attempts: maxAttempts }
          }).catch(() => {});
        } catch {}
      }
    }
  }
  activeCount--;
  processNext();
};

export const enqueue = (name, handler, maxRetries = 2) => {
  queue.push({ name, handler, maxRetries });
  processNext();
};

export const enqueueBatch = (jobs) => {
  for (const job of jobs) {
    queue.push(job);
  }
  if (activeCount < MAX_CONCURRENT) processNext();
};

export const queueSize = () => queue.length + activeCount;

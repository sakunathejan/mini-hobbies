const queue = [];
let activeCount = 0;
const MAX_CONCURRENT = 3;

const processNext = () => {
  if (queue.length === 0 || activeCount >= MAX_CONCURRENT) {
    return;
  }
  const job = queue.shift();
  activeCount++;
  executeJob(job);
};

const executeJob = async (job) => {
  const maxAttempts = job.maxRetries ?? 2;
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      await job.handler();
      if (job.resolve) job.resolve(true);
      break;
    } catch (err) {
      console.error(`[QUEUE] FAIL job "${job.name}" (attempt ${attempt}/${maxAttempts}): ${err.message}`);
      if (attempt < maxAttempts) {
        await new Promise((r) => setTimeout(r, 1000 * attempt));
      } else {
        console.error(`[QUEUE] EXHAUSTED job "${job.name}" — all ${maxAttempts} attempts failed.`);
        if (job.reject) job.reject(err);
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
  return new Promise((resolve, reject) => {
    queue.push({ name, handler, maxRetries, resolve, reject });
    processNext();
  });
};

export const enqueueBatch = (jobs) => {
  const promises = jobs.map((job) => {
    return new Promise((resolve, reject) => {
      queue.push({ ...job, resolve, reject });
    });
  });
  if (activeCount < MAX_CONCURRENT) processNext();
  return Promise.allSettled(promises);
};

export const queueSize = () => queue.length + activeCount;

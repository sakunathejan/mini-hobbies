const queue = [];
let processing = false;

const processNext = async () => {
  if (processing || queue.length === 0) return;
  processing = true;
  const job = queue.shift();
  try {
    await job.handler();
  } catch (err) {
    console.error(`Job ${job.name} failed:`, err.message);
  } finally {
    processing = false;
    processNext();
  }
};

export const enqueue = (name, handler) => {
  queue.push({ name, handler });
  if (!processing) processNext();
};

export const enqueueBatch = (jobs) => {
  queue.push(...jobs);
  if (!processing) processNext();
};

export const queueSize = () => queue.length;

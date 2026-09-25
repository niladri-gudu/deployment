import { Worker } from "bullmq";
import { prisma } from "../config/database.js";
import { redis } from "../queues/connection.js";

interface TaskJob {
  taskId: string;
}

const workerId = process.env.HOSTNAME ?? `worker-${process.pid}`;

function randomInt(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function cpuWork(durationMs: number) {
  const start = Date.now();
  const end = start + durationMs;

  let iterations = 0;
  let value = 0;

  while (Date.now() < end) {
    value = Math.sqrt(value + iterations);
    value = Math.sin(value);
    value = Math.cos(value);
    value = Math.sqrt(Math.abs(value) + 1);

    iterations++;
  }

  return {
    durationMs: Date.now() - start,
    iterations,
    finalValue: value,
  };
}

const concurrency = Number(process.env.WORKER_CONCURRENCY ?? 1);

const worker = new Worker<TaskJob>(
  "tasks",
  async (job) => {
    const jobStartedAt = Date.now();
    const { taskId } = job.data;
    const maxAttempts = job.opts.attempts ?? 3;

    console.log(
      `[worker=${workerId}] START job=${job.id} task=${taskId} attempt=${job.attemptsMade + 1}/${maxAttempts}`,
    );

    try {
      await prisma.task.update({
        where: {
          id: taskId,
        },
        data: {
          status: "PROCESSING",
          error: null,
        },
      });

      const cpuStart = Date.now();

      const workloadDuration = randomInt(2000, 8000);

      console.log(
        `[worker=${workerId}] CPU_START job=${job.id} target=${workloadDuration}ms`,
      );

      const cpuResult = cpuWork(workloadDuration);

      const cpuElapsed = Date.now() - cpuStart;

      console.log(
        `[worker=${workerId}] CPU_END job=${job.id} actual=${cpuResult.durationMs}ms iterations=${cpuResult.iterations}`,
      );

      const task = await prisma.task.findUnique({
        where: {
          id: taskId,
        },
      });

      if (!task) {
        throw new Error(`Task ${taskId} not found`);
      }

      const dbStart = Date.now();

      await prisma.task.update({
        where: { id: taskId },
        data: {
          status: "COMPLETED",
          result: {
            message: "Task processed successfully",
            workloadDuration,
            actualDuration: cpuResult.durationMs,
            iterations: cpuResult.iterations,
            finalValue: cpuResult.finalValue,
            processedBy: workerId,
          },
        },
      });

      const dbElapsed = Date.now() - dbStart;
      const totalElapsed = Date.now() - jobStartedAt;

      console.log(
        `[worker=${workerId}] COMPLETE job=${job.id} ` +
          `cpu=${cpuElapsed}ms db=${dbElapsed}ms total=${totalElapsed}ms`,
      );
    } catch (err) {
      const attemptsMade = job.attemptsMade + 1;
      const message = err instanceof Error ? err.message : String(err);

      // Only mark FAILED on the final attempt so BullMQ retries stay in PROCESSING.
      if (attemptsMade >= maxAttempts) {
        await prisma.task
          .update({
            where: { id: taskId },
            data: { status: "FAILED", error: message },
          })
          .catch((dbErr) =>
            console.error(
              `[worker=${workerId}] FAILED to mark task failed task=${taskId} error=${String(dbErr)}`,
            ),
          );
      }

      throw err;
    }
  },
  {
    connection: redis,
    concurrency,
  },
);

worker.on("completed", (job) => {
  console.log(`[worker=${workerId}] SUCCESS job=${job.id}`);
});

worker.on("failed", (job, error) => {
  console.error(
    `[worker=${workerId}] FAILED job=${job?.id} ` +
      `attempt=${job?.attemptsMade} error=${error.message}`,
  );
});

async function shutdown(signal: string) {
  console.log(`[worker=${workerId}] ${signal} received. Closing...`);
  await worker.close().catch(() => {});
  await prisma.$disconnect().catch(() => {});
  redis.disconnect();
  process.exit(0);
}

process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));
process.on("unhandledRejection", (e) => console.error(e));

console.log(
  `[worker=${workerId}] started (concurrency=${concurrency}) and waiting for jobs...`,
);

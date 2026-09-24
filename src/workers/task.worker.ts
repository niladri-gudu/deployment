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

const worker = new Worker<TaskJob>(
  "tasks",
  async (job) => {
    const jobStartedAt = Date.now();
    const { taskId } = job.data;

    console.log(
      `[worker=${workerId}] START job=${job.id} task=${taskId} attempt=${job.attemptsMade + 1}`,
    );

    await prisma.task.update({
      where: {
        id: taskId,
      },
      data: {
        status: "PROCESSING",
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
  },
  {
    connection: redis,
    concurrency: 1,
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

console.log(`[worker=${workerId}] started and waiting for jobs...`);

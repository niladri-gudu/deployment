import { Prisma } from "../generated/prisma/client.js";
import { prisma } from "../config/database.js";
import { taskQueue } from "../queues/task.queue.js";

interface CreateTaskInput {
  type: string;
  payload: Prisma.InputJsonValue | null;
}

export async function createTask(input: CreateTaskInput) {
  const task = await prisma.task.create({
    data: {
      type: input.type,
      payload: input.payload ?? Prisma.JsonNull,
    },
  });

  await taskQueue.add(
    "process-task",
    {
      taskId: task.id,
    },
    {
      attempts: 3,
      backoff: {
        type: "exponential",
        delay: 1000,
      },
      removeOnComplete: 100,
      removeOnFail: 1000,
    },
  );

  return task;
}

export async function getTask(taskId: string) {
  return prisma.task.findUnique({
    where: {
      id: taskId,
    },
  });
}

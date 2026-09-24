import { Request, Response } from "express";
import { z } from "zod";
import { createTask, getTask } from "../services/task.service.js";

const createTaskSchema = z.object({
  type: z.string().min(1),
  payload: z.json(),
});

export async function createTaskController(req: Request, res: Response) {
  const result = createTaskSchema.safeParse(req.body);

  if (!result.success) {
    return res.status(400).json({
      error: "Invalid request",
      details: result.error.flatten(),
    });
  }

  const task = await createTask(result.data);

  return res.status(202).json({
    taskId: task.id,
    status: task.status,
  });
}

export async function getTaskController(req: Request, res: Response) {
  const taskId = req.params.id;

  if (typeof taskId !== "string") {
    return res.status(400).json({
      error: "Invalid task ID",
    });
  }

  const task = await getTask(taskId);

  if (!task) {
    return res.status(404).json({
      error: "Task not found",
    });
  }

  return res.json(task);
}

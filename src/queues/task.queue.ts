import { Queue } from "bullmq";
import { redis } from "./connection.js";

export const taskQueue = new Queue("tasks", {
  connection: redis,
});

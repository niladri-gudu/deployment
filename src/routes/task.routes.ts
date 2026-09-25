import { Router } from "express";
import {
  createTaskController,
  getTaskController,
  listTasksController,
} from "../controllers/task.controller.js";

const router = Router();

router.post("/tasks", createTaskController);
router.get("/tasks", listTasksController);
router.get("/tasks/:id", getTaskController);

export default router;

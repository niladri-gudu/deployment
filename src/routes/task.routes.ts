import { Router } from "express";
import {
  createTaskController,
  getTaskController,
} from "../controllers/task.controller.js";

const router = Router();

router.post("/tasks", createTaskController);
router.get("/tasks/:id", getTaskController);

export default router;

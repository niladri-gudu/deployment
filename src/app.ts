import express from "express";
import cors from "cors";
import helmet from "helmet";
import taskRoutes from "./routes/task.routes.js";
import { prisma } from "./config/database.js";

export const app = express();

app.use(helmet());
app.use(cors());
app.use(express.json());

app.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

app.get("/api/server-info", (_req, res) => {
  res.json({
    hostname: process.env.HOSTNAME,
    pid: process.pid,
  });
});

app.get("/ready", async (_req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;

    res.json({
      status: "ready",
      hostname: process.env.HOSTNAME,
    });
  } catch {
    res.status(503).json({
      status: "not ready",
      hostname: process.env.HOSTNAME,
    });
  }
});

app.get("/api/slow", async (_req, res) => {
  const duration = Number(process.env.SLOW_DURATION ?? 5000);

  await new Promise((resolve) => {
    setTimeout(resolve, duration);
  });

  res.json({
    hostname: process.env.HOSTNAME,
    duration,
  });
});

app.get("/api/cpu", (_req, res) => {
  const start = Date.now();

  let result = 0;

  while (Date.now() - start < 5000) {
    for (let i = 0; i < 1_000_000; i++) {
      result += Math.sqrt(i);
    }
  }

  res.json({
    hostname: process.env.HOSTNAME,
    duration: Date.now() - start,
    result,
  });
});

app.use("/api", taskRoutes);

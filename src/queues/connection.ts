import { Redis } from "ioredis";
import { env } from "../config/env.js";

export const redis = new Redis({
  host: env.REDIS_HOST,
  port: env.REDIS_PORT,
  password: env.REDIS_PASSWORD || undefined,

  tls: env.REDIS_TLS ? {} : undefined,

  maxRetriesPerRequest: null,
  enableReadyCheck: true,
  retryStrategy: (t) => Math.min(t * 100, 3000),
});

redis.on("error", (e) => console.error("redis", e.message));

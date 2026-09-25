import "dotenv/config";
import { z } from "zod";

const envSchema = z.object({
  PORT: z.coerce.number().default(4000),
  DATABASE_URL: z.string().min(1),
  READ_DATABASE_URL: z.string().optional(),
  REDIS_HOST: z.string().default("localhost"),
  REDIS_PORT: z.coerce.number().default(6379),
  REDIS_PASSWORD: z.string().optional(),
  PG_POOL_MAX: z.coerce.number().default(20),
  WORKER_CONCURRENCY: z.coerce.number().default(1),
});

export const env = envSchema.parse(process.env);

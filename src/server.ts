import { app } from "./app.js";
import { env } from "./config/env.js";
import { prisma } from "./config/database.js";
import { redis } from "./queues/connection.js";

const server = app.listen(env.PORT, () => console.log(`API ${env.PORT}`));

async function shutdown(sig: string) {
  server.close(async () => {
    await prisma.$disconnect().catch(() => {});
    redis.disconnect();
    process.exit(0);
  });
  setTimeout(() => process.exit(1), 10000).unref();
}
process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));
process.on("unhandledRejection", (e) => console.error(e));

import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../generated/prisma/client.js";
import pg from "pg";
import { env } from "./env.js";

const pool = new pg.Pool({
  connectionString: env.DATABASE_URL,
  max: env.PG_POOL_MAX,
  idleTimeoutMillis: 30000,
});

const adapter = new PrismaPg(pool as any);

export const prisma = new PrismaClient({ adapter });

// RDS read-replica path (Phase 3): point READ_DATABASE_URL at the replica
// and use prismaRead for GET /api/tasks list queries.
// import { PrismaPg as PrismaPgRead } from "@prisma/adapter-pg";
// export const prismaRead = env.READ_DATABASE_URL
//   ? new PrismaClient({
//       adapter: new PrismaPgRead(
//         new pg.Pool({ connectionString: env.READ_DATABASE_URL }) as any,
//       ),
//     })
//   : prisma;

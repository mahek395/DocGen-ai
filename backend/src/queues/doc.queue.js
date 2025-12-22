import { Queue } from "bullmq";
import redisConnection from "../config/redis.js";

export const docQueue = new Queue("doc-queue", {
  connection: redisConnection,
  lockDuration: 10 * 60 * 1000, // 10 minutes
  stalledInterval: 30 * 1000,  // check every 30s
  maxStalledCount: 1           // avoid infinite retries
});

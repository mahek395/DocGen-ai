import IORedis from "ioredis";
import dotenv from "dotenv";
dotenv.config();

const redisConnection = process.env.REDIS_URL
  ? new IORedis(process.env.REDIS_URL, {
      maxRetriesPerRequest: null,
      tls: {}  
    })
  : new IORedis({
      host: process.env.REDIS_HOST,
      port: process.env.REDIS_PORT,
      password: process.env.REDIS_PASSWORD,
      maxRetriesPerRequest: null,
    });

redisConnection.on("connect", () => console.log("✅ Redis connected"));
redisConnection.on("error", (err) => console.error("❌ Redis connection error:", err));

export default redisConnection;

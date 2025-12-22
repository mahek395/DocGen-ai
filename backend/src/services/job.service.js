import pool from "../config/db.js";
import docQueue from "../queues/doc.queue.js";
import JOB_STATUS from "../constants/jobStatus.js";
import { v4 as uuidv4 } from "uuid";

export async function createJob(repoUrl) {
  const jobId = uuidv4();

  // 1. Insert job into MySQL
  await pool.query(
    "INSERT INTO jobs (id, repo_url, status, progress) VALUES (?, ?, ?, ?)",
    [jobId, repoUrl, JOB_STATUS.PENDING, 0]
  );

  // 2. Add job to Redis queue
  await docQueue.add("generate-docs", {
    jobId,
    repoUrl
  });

  return jobId;
}

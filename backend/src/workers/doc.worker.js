import { Worker } from "bullmq";
import redisConnection from "../config/redis.js";
import pool from "../config/db.js";
import JOB_STATUS from "../constants/jobStatus.js";
import simpleGit from "simple-git";
import { readFilesRecursively } from "../utils/fileUtils.js";
import {
  detectRepoType,
  detectTechStack,
  detectEntryPoints,
  detectRoutes,
  detectDatabaseSchema,
  detectBackgroundJobs,
  detectAuth,
  detectEnvVariables,
  generateFolderTree
} from "../utils/repoAnalysis.js";
import { generateDocumentation } from "../utils/openRouterAPI.js";
import { splitDocuments } from "../utils/splitDocuments.js"; // ✅ USE SHARED UTILITY
import fs from "fs";
import path from "path";
import os from "os";

const worker = new Worker(
  "doc-queue",
  async (job) => {
    const { jobId, repoUrl } = job.data;
    console.log(`🤖 Worker started job ${jobId}`);

    const tempDir = path.join(os.tmpdir(), `repo-${jobId}`);
    const git = simpleGit();

    try {
      /* ------------------------------------------------
         STEP 1: Mark job as PROCESSING
      ------------------------------------------------ */
      await pool.query(
        "UPDATE jobs SET status = ?, progress = ? WHERE id = ?",
        [JOB_STATUS.PROCESSING, 10, jobId]
      );

      /* ------------------------------------------------
         STEP 2: Clone repository
      ------------------------------------------------ */
      console.log("📥 Cloning repository...");
      await git.clone(repoUrl, tempDir);

      await pool.query(
        "UPDATE jobs SET progress = ? WHERE id = ?",
        [30, jobId]
      );

      /* ------------------------------------------------
         STEP 3: Scan project files
      ------------------------------------------------ */
      console.log("📂 Scanning project files...");
      const files = readFilesRecursively(tempDir);
      console.log(`📄 Total files collected: ${files.length}`);

      await pool.query(
        "UPDATE jobs SET progress = ? WHERE id = ?",
        [50, jobId]
      );

      /* ------------------------------------------------
         STEP 4: Repository Analysis
      ------------------------------------------------ */
      console.log("🔍 Analyzing repository...");

      const analysis = {
        repoType: detectRepoType(files),
        techStack: detectTechStack(files),
        entryPoints: detectEntryPoints(files),
        routes: detectRoutes(files),
        database: detectDatabaseSchema(files),
        workers: detectBackgroundJobs(files),
        auth: detectAuth(files),
        envVars: detectEnvVariables(files),
        folderTree: generateFolderTree(tempDir)
      };

      console.log("🧠 Analysis complete");

      await pool.query(
        "UPDATE jobs SET progress = ? WHERE id = ?",
        [75, jobId]
      );

      /* ------------------------------------------------
         STEP 5: Generate AI Documentation
      ------------------------------------------------ */
      console.log("✨ Generating documentation with AI...");

      const documentation = await generateDocumentation(analysis);

      const { readme, developerGuide } = splitDocuments(documentation);

      console.log("📄 README length:", readme.length);
      console.log("📘 Developer guide length:", developerGuide.length);

      await pool.query(
        `
        UPDATE jobs
        SET
          readme_md = ?,
          developer_guide_md = ?,
          progress = ?
        WHERE id = ?
        `,
        [readme, developerGuide, 95, jobId]
      );

      /* ------------------------------------------------
         STEP 6: Cleanup
      ------------------------------------------------ */
      fs.rmSync(tempDir, { recursive: true, force: true });
      console.log("🧹 Cleaned up temp files");

      /* ------------------------------------------------
         STEP 7: Mark job as COMPLETED
      ------------------------------------------------ */
      await pool.query(
        "UPDATE jobs SET status = ?, progress = ? WHERE id = ?",
        [JOB_STATUS.COMPLETED, 100, jobId]
      );

      console.log(`✅ Job ${jobId} completed successfully`);
    } catch (error) {
      console.error(`❌ Job ${jobId} failed`, error);

      await pool.query(
        "UPDATE jobs SET status = ?, error_message = ? WHERE id = ?",
        [JOB_STATUS.FAILED, error.message, jobId]
      );

      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  },
  {
    connection: redisConnection,
    lockDuration: 600000 // ✅ prevents BullMQ lock renewal errors
  }
);

console.log("🤖 Worker is running and waiting for jobs...");

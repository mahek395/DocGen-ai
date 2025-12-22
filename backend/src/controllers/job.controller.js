import pool from "../config/db.js";
import { docQueue } from "../queues/doc.queue.js";
import { v4 as uuidv4 } from "uuid";
import JOB_STATUS from "../constants/jobStatus.js";
import { generatePdfFromText } from "../utils/pdfGenerator.js";

/* ----------------------------------------
   CREATE JOB
---------------------------------------- */
export async function createJob(req, res) {
  try {
    const { repoUrl } = req.body;

    if (!repoUrl) {
      return res.status(400).json({
        message: "repoUrl is required"
      });
    }

    const jobId = uuidv4();

    await pool.query(
      `
      INSERT INTO jobs (id, repo_url, status, progress)
      VALUES (?, ?, ?, ?)
      `,
      [jobId, repoUrl, JOB_STATUS.PENDING, 0]
    );

    await docQueue.add("generate-doc", {
      jobId,
      repoUrl
    });

    return res.status(201).json({
      jobId,
      status: JOB_STATUS.PENDING
    });
  } catch (error) {
    console.error("Error creating job:", error);
    return res.status(500).json({
      message: "Internal server error"
    });
  }
}

/* ----------------------------------------
   GET JOB STATUS + DOCUMENTS
---------------------------------------- */
export async function getJobById(req, res) {
  try {
    const { jobId } = req.params;

    const [rows] = await pool.query(
      `
      SELECT
        id,
        status,
        progress,
        readme_md,
        developer_guide_md,
        error_message,
        created_at,
        updated_at
      FROM jobs
      WHERE id = ?
      `,
      [jobId]
    );

    if (rows.length === 0) {
      return res.status(404).json({
        message: "Job not found"
      });
    }

    const job = rows[0];

    return res.status(200).json({
      job: {
        id: job.id,
        status: job.status,
        progress: job.progress,
        documents: {
          readme: job.readme_md,
          developerGuide: job.developer_guide_md
        },
        error: job.error_message,
        timestamps: {
          createdAt: job.created_at,
          updatedAt: job.updated_at
        }
      }
    });
  } catch (error) {
    console.error("Error fetching job:", error);
    return res.status(500).json({
      message: "Internal server error"
    });
  }
}
/* ----------------------------------------
   DOWNLOAD DEVELOPER GUIDE PDF
---------------------------------------- */
export async function downloadDeveloperGuidePdf(req, res) {
  try {
    const { jobId } = req.params;

    const [rows] = await pool.query(
      `
      SELECT developer_guide_md
      FROM jobs
      WHERE id = ?
      `,
      [jobId]
    );

    if (!rows.length || !rows[0].developer_guide_md) {
      return res.status(404).json({
        message: "Developer guide not found"
      });
    }

    generatePdfFromText(
      "Developer Guide",
      rows[0].developer_guide_md,
      res
    );
  } catch (error) {
    console.error("PDF generation error:", error);
    res.status(500).json({
      message: "Failed to generate PDF"
    });
  }
}

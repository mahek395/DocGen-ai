import express from "express";
import { createJob, getJobById } from "../controllers/job.controller.js";
import {
  downloadDeveloperGuidePdf
} from "../controllers/job.controller.js";

const router = express.Router();

router.post("/", createJob);
router.get("/:jobId", getJobById);

// ✅ NEW
router.get(
  "/:jobId/developer-guide.pdf",
  downloadDeveloperGuidePdf
);
router.post("/", createJob);
router.get("/:jobId", getJobById);

export default router;

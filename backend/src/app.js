import express from "express";
import dotenv from "dotenv";
import jobRoutes from "./routes/job.routes.js";
import "./config/redis.js";
import cors from "cors";

dotenv.config();

const app = express();

const allowedOrigins = [
  "http://localhost:5173",
  "https://doc-gen-ai-u1v5.vercel.app",
  "https://doc-gen-ai-u1v5-dl41y4rtk-mahekshah395-8301s-projects.vercel.app",
  "https://doc-gen-ai-u1v5-e63qwpjmd-mahekshah395-8301s-projects.vercel.app"
];

app.use(cors({
  origin: allowedOrigins,
  methods: ["GET", "POST", "OPTIONS"],
  allowedHeaders: ["Content-Type"],
  credentials: true
}));

// handle preflight requests
app.options("*", cors());

app.use(express.json());

// Health check
app.get("/health", (req, res) => {
  res.json({ status: "OK", message: "Server is running" });
});

// Routes
app.use("/api/jobs", jobRoutes);

export default app;

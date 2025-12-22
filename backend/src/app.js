import express from "express";
import dotenv from "dotenv";
import jobRoutes from "./routes/job.routes.js";
import "./config/redis.js";
import cors from "cors";


// Load environment variables
dotenv.config();

const app = express();
app.use(cors({
  origin: process.env.CORS_ORIGIN || "http://localhost:5173",
  methods: ["GET", "POST"],
  credentials: true
}));

app.use(express.json());

// Health check route (very useful)
app.get("/health", (req, res) => {
  res.json({ status: "OK", message: "Server is running" });
});

// Job-related routes
app.use("/api/jobs", jobRoutes);


export default app;

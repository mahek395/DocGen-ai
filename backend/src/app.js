import express from "express";
import dotenv from "dotenv";
import jobRoutes from "./routes/job.routes.js";
import "./config/redis.js";
import cors from "cors";


// Load environment variables
dotenv.config();

const app = express();
const allowedOrigins = [
  "http://localhost:5173",
  "https://doc-gen-ai-u1v5.vercel.app",
  "https://doc-gen-ai-u1v5-dl41y4rtk-mahekshah395-8301s-projects.vercel.app"
];

app.use(cors({
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
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

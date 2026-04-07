import app from "./app.js";
import pool from "./config/db.js";

const PORT = process.env.PORT || 5000;

async function startServer() {
  try {
    // Check MySQL connection
    await pool.query("SELECT 1");
    console.log("✅ MySQL connected");

    // Start Express server
    app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
    });

    // Start BullMQ worker AFTER DB connection
    await import("./workers/doc.worker.js");

    console.log("🤖 BullMQ worker started");

  } catch (error) {
    console.error("❌ MySQL connection failed:", error.message);
    process.exit(1);
  }
}

startServer();

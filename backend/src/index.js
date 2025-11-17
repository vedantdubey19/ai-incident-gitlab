import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { connectDB } from "./db/mongoose.js";
import { errorHandler } from "./middlewares/errorHandler.js";

import healthRouter from "./routes/health.routes.js";
import projectsRouter from "./routes/projects.routes.js";
import incidentsRouter from "./routes/incidents.routes.js";
import webhooksRouter from "./routes/webhooks.routes.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());

// Routes
app.use("/api/health", healthRouter);
app.use("/api/projects", projectsRouter);
app.use("/api/incidents", incidentsRouter);
app.use("/api/health", healthRouter);
app.use("/api/projects", projectsRouter);
app.use("/api/incidents", incidentsRouter);
app.use("/api/webhooks", webhooksRouter);

// Global error handler
app.use(errorHandler);

async function start() {
  await connectDB();

  app.listen(PORT, () => {
    console.log(`🚀 Backend running on port ${PORT}`);
  });
}

start().catch((err) => {
  console.error("Failed to start server:", err.message);
  process.exit(1);
});

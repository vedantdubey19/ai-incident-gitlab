import axios from "axios";

const AI_SERVICE_URL = process.env.AI_SERVICE_URL || "http://localhost:5001";
const AI_TOKEN = process.env.AI_SERVICE_TOKEN || "dev-token";

const client = axios.create({
  baseURL: AI_SERVICE_URL,
  headers: {
    "x-ai-service-token": AI_TOKEN,
    "Content-Type": "application/json"
  }
});

export async function callRCA({ incidentId, logs, gitlabCiConfig, metadata }) {
  const res = await client.post("/ai/rca", {
    incidentId,
    logs,
    gitlabCiConfig,
    metadata
  });
  return res.data;
}

export async function callGeneratePatch({
  incidentId,
  logs,
  gitlabCiConfig,
  files,
  metadata
}) {
  const res = await client.post("/ai/generate-patch", {
    incidentId,
    logs,
    gitlabCiConfig,
    files,
    metadata
  });
  return res.data;
}
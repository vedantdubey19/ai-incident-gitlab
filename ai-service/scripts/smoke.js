import { spawn } from "child_process";

const server = spawn("node", ["src/index.js"], {
  cwd: process.cwd(),
  stdio: ["ignore", "pipe", "pipe"]
});

let tested = false;

server.stdout.on("data", async (data) => {
  process.stdout.write(`[server] ${data}`);
  if (!tested && data.toString().includes("AI service running")) {
    tested = true;
    try {
      const payload = {
        incidentId: "test1",
        logs: "npm ERR! missing script: test",
        gitlabCiConfig: "stages: [build]",
        metadata: {
          projectName: "demo",
          pipelineId: 123
        }
      };

      const rcaRes = await fetch("http://localhost:5001/ai/rca", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-ai-service-token": "dev-token"
        },
        body: JSON.stringify(payload)
      });
      const rcaBody = await rcaRes.text();
      console.log("RCA status:", rcaRes.status);
      console.log(rcaBody);

      const patchRes = await fetch("http://localhost:5001/ai/generate-patch", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-ai-service-token": "dev-token"
        },
        body: JSON.stringify(payload)
      });
      const patchBody = await patchRes.text();
      console.log("Patch status:", patchRes.status);
      console.log(patchBody);
    } catch (err) {
      console.error("Smoke test failed:", err);
      process.exitCode = 1;
    } finally {
      server.kill();
    }
  }
});

server.stderr.on("data", (data) => {
  process.stderr.write(`[server-err] ${data}`);
});

server.on("exit", (code) => {
  console.log(`Server exited with code ${code}`);
  if (!tested) {
    process.exitCode = process.exitCode || code || 1;
  }
});

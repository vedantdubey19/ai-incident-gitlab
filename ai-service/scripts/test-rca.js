const payload = {
  incidentId: "test1",
  logs: "npm ERR! missing script: test",
  gitlabCiConfig: "stages: [build]",
  metadata: {
    projectName: "demo",
    pipelineId: 123
  }
};

fetch("http://localhost:5001/ai/rca", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "x-ai-service-token": "dev-token"
  },
  body: JSON.stringify(payload)
})
  .then(async (res) => {
    const text = await res.text();
    console.log("Status:", res.status);
    console.log(text);
  })
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });

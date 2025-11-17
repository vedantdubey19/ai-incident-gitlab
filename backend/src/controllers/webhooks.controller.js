import { Project } from "../models/Project.js";
import { Incident } from "../models/Incident.js";
import {
  fetchPipelineJobs,
  fetchJobLog,
  fetchGitlabCiConfig
} from "../services/gitlab.service.js";

function extractErrorSnippet(logs) {
  if (!logs) return "";
  const lines = logs.split("\n");
  const hit =
    lines.find((l) => /error|failed|failure|exception/i.test(l)) ||
    lines.slice(-20).join("\n");
  return typeof hit === "string" ? hit.slice(0, 1000) : "";
}

export async function handleGitlabWebhook(req, res, next) {
  try {
    console.log("🔥 GitLab webhook received");
    console.log("Headers:", {
      event: req.header("X-Gitlab-Event"),
      contentType: req.header("content-type")
    });

    console.log(
      "Basic payload info:",
      JSON.stringify(
        {
          object_kind: req.body.object_kind,
          status: req.body.object_attributes?.status,
          pipelineId: req.body.object_attributes?.id,
          project_id: req.body.project?.id,
          project_path: req.body.project?.path_with_namespace
        },
        null,
        2
      )
    );

    const event = req.header("X-Gitlab-Event");
    if (event !== "Pipeline Hook") {
      console.log("Ignoring non-pipeline event:", event);
      return res.json({
        success: true,
        data: { ignored: true, reason: "Not a Pipeline Hook event" },
        error: null
      });
    }

    const payload = req.body;
    const objectKind = payload.object_kind;
    const pipeline = payload.object_attributes;

    if (objectKind !== "pipeline" || !pipeline) {
      console.log("Ignoring event without pipeline object");
      return res.json({
        success: true,
        data: { ignored: true, reason: "object_kind != pipeline" },
        error: null
      });
    }

    if (pipeline.status !== "failed") {
      console.log("Pipeline status is not failed:", pipeline.status);
      return res.json({
        success: true,
        data: { ignored: true, reason: `status=${pipeline.status}` },
        error: null
      });
    }

    const gitlabProjectId = payload.project?.id;
    const gitlabProjectWebUrl = payload.project?.web_url;

    let project = null;

    if (gitlabProjectId) {
      project = await Project.findOne({ gitlabProjectId });
    }
    if (!project && gitlabProjectWebUrl) {
      project = await Project.findOne({ gitlabUrl: gitlabProjectWebUrl });
    }

    if (!project) {
      console.warn("No matching Project found for webhook project id/url");
      return res.json({
        success: true,
        data: { ignored: true, reason: "Project not registered" },
        error: null
      });
    }

    console.log("Matched project:", {
      id: project._id.toString(),
      name: project.name,
      gitlabProjectId: project.gitlabProjectId
    });

    const pipelineId = pipeline.id;
    const ref = pipeline.ref;
    const commitSha = pipeline.sha;

    const pipelineUrl =
      pipeline.web_url ||
      `${project.gitlabUrl}/-/pipelines/${pipelineId}`;

    // Fetch jobs for this pipeline
    let jobs = [];
    try {
      jobs = await fetchPipelineJobs(project, pipelineId);
      console.log(`Fetched ${jobs.length} jobs for pipeline`, pipelineId);
    } catch (err) {
      console.warn("Failed to fetch jobs for pipeline:", err.message);
    }

    const failedJobs = jobs.filter((j) => j.status === "failed");
    let targetJob = null;

    if (failedJobs.length > 0) {
      targetJob = failedJobs.sort(
        (a, b) => new Date(b.finished_at) - new Date(a.finished_at)
      )[0];
    }

    let fullLogs = "";
    let errorSnippet = "";

    if (targetJob) {
      try {
        fullLogs = await fetchJobLog(project, targetJob.id);
        errorSnippet = extractErrorSnippet(fullLogs);
        console.log(
          `Fetched logs for job ${targetJob.id} (${targetJob.name}), length=${fullLogs.length}`
        );
      } catch (err) {
        console.warn("Failed to fetch job logs:", err.message);
      }
    } else {
      console.log("No failed jobs found for this pipeline");
    }

    let gitlabCiConfig = null;
    try {
      gitlabCiConfig = await fetchGitlabCiConfig(project, ref);
      if (gitlabCiConfig) {
        console.log(".gitlab-ci.yml content fetched");
      }
    } catch (err) {
      console.warn("Failed to fetch .gitlab-ci.yml:", err.message);
    }

    const incident = await Incident.create({
      project: project._id,
      pipelineId,
      pipelineUrl,
      jobId: targetJob ? targetJob.id : null,
      jobName: targetJob ? targetJob.name : null,
      status: "open",
      category: null,
      gitRef: ref,
      commitSha,
      errorSnippet,
      logsStored: !!fullLogs,
      fullLogs: fullLogs || null,
      gitlabCiConfig
    });

    console.log("✅ Incident created:", incident._id.toString());

    return res.status(201).json({
      success: true,
      data: { incidentId: incident._id },
      error: null
    });
  } catch (err) {
    console.error("Webhook handler error:", err);
    next(err);
  }
}

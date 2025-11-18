import { Incident } from "../models/Incident.js";
import { AIAnalysis } from "../models/AIAnalysis.js";
import { AIPatch } from "../models/AIPatch.js";
import { callRCA, callGeneratePatch } from "../services/ai.service.js";
import { Project } from "../models/Project.js";
import {
  createBranch,
  getFile,
  commitFile,
  createMR as createGitlabMR
} from "../services/gitlab.service.js";
import { cleanDiff, extractFilePath, isNewFile } from "../utils/diffParser.js";
import {
  applyPatchNewFile,
  applyPatchExistingFile
} from "../utils/patchEngine.js";

export async function listIncidents(req, res, next) {
  try {
    const { projectId, status, category } = req.query;

    const filter = {};
    if (projectId) filter.project = projectId;
    if (status) filter.status = status;
    if (category) filter.category = category;

    const items = await Incident.find(filter)
      .populate("project", "name gitlabUrl")
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: {
        items,
        page: 1,
        pageSize: items.length,
        total: items.length
      },
      error: null
    });
  } catch (err) {
    next(err);
  }
}

export async function getIncident(req, res, next) {
  try {
    const incident = await Incident.findById(req.params.id)
      .populate("project", "name gitlabUrl")
      .populate("aiAnalysis")
      .populate("aiPatch");

    if (!incident) {
      return res.status(404).json({
        success: false,
        data: null,
        error: { code: "INCIDENT_NOT_FOUND", message: "Incident not found" }
      });
    }

    res.json({
      success: true,
      data: { incident },
      error: null
    });
  } catch (err) {
    next(err);
  }
}

export async function updateIncident(req, res, next) {
  try {
    const updates = req.body;

    const incident = await Incident.findByIdAndUpdate(
      req.params.id,
      { ...updates },
      { new: true }
    );

    if (!incident) {
      return res.status(404).json({
        success: false,
        data: null,
        error: { code: "INCIDENT_NOT_FOUND", message: "Incident not found" }
      });
    }

    res.json({
      success: true,
      data: { incident },
      error: null
    });
  } catch (err) {
    next(err);
  }
}

// Stubbed AI + MR endpoints (we'll wire to AI + GitLab later)

export async function triggerAnalysis(req, res, next) {
  try {
    const incident = await Incident.findById(req.params.id).populate(
      "project",
      "name gitlabProjectId gitlabUrl"
    );

    if (!incident) {
      return res.status(404).json({
        success: false,
        data: null,
        error: { code: "INCIDENT_NOT_FOUND", message: "Incident not found" }
      });
    }

    const rca = await callRCA({
      incidentId: incident._id.toString(),
      logs: incident.fullLogs || "",
      gitlabCiConfig: incident.gitlabCiConfig || "",
      metadata: {
        projectName: incident.project?.name,
        pipelineId: incident.pipelineId,
        jobName: incident.jobName,
        gitRef: incident.gitRef
      }
    });

    const analysis = await AIAnalysis.create({
      incident: incident._id,
      summary: rca.summary,
      rootCause: rca.rootCause,
      category: rca.category,
      confidence: rca.confidence
    });

    incident.aiAnalysis = analysis._id;
    if (!incident.category && rca.category) {
      incident.category = rca.category;
    }
    await incident.save();

    res.json({
      success: true,
      data: { aiAnalysis: analysis },
      error: null
    });
  } catch (err) {
    next(err);
  }
}

export async function triggerPatch(req, res, next) {
  try {
    const incident = await Incident.findById(req.params.id).populate(
      "project",
      "name gitlabProjectId gitlabUrl"
    );

    if (!incident) {
      return res.status(404).json({
        success: false,
        data: null,
        error: { code: "INCIDENT_NOT_FOUND", message: "Incident not found" }
      });
    }

    // TODO: later fetch related repo files via GitLab; for now, empty
    const files = [];

    const patchRes = await callGeneratePatch({
      incidentId: incident._id.toString(),
      logs: incident.fullLogs || "",
      gitlabCiConfig: incident.gitlabCiConfig || "",
      files,
      metadata: {
        projectName: incident.project?.name,
        pipelineId: incident.pipelineId,
        jobName: incident.jobName,
        gitRef: incident.gitRef
      }
    });

    const patch = await AIPatch.create({
      incident: incident._id,
      diff: patchRes.diff,
      description: patchRes.description,
      riskLevel: patchRes.riskLevel || "medium"
    });

    incident.aiPatch = patch._id;
    await incident.save();

    res.json({
      success: true,
      data: { aiPatch: patch },
      error: null
    });
  } catch (err) {
    next(err);
  }
}

export async function createMergeRequest(req, res, next) {
  try {
    const incidentId = req.params.incidentId || req.params.id;

    const incident = await Incident.findById(incidentId).populate("aiPatch");
    if (!incident) {
      return res.status(404).json({ error: "Incident not found" });
    }

    const project = await Project.findById(incident.project);
    if (!project) {
      return res.status(404).json({ error: "Project not found" });
    }

    if (!incident.aiPatch?.diff) {
      return res.status(400).json({ error: "AI patch missing. Generate patch first." });
    }

    const diff = cleanDiff(incident.aiPatch.diff);

    if (!diff || diff.length < 10) {
      return res.status(400).json({ error: "Empty or invalid AI diff" });
    }

    const filePath = extractFilePath(diff);
    if (!filePath) {
      return res.status(400).json({ error: "Could not detect file path from diff" });
    }

    const branch = `incident-fix-${incident._id}`;
    const newFile = isNewFile(diff);

    try {
      await createBranch(project, branch);
    } catch (err) {
      if (err.response?.data?.message === "Branch already exists") {
        console.log("⚠️ Branch already exists → reusing:", branch);
      } else {
        throw err;
      }
    }

    let updatedContent;

    if (newFile) {
      updatedContent = applyPatchNewFile(diff);

      if (!updatedContent?.trim()) {
        return res.status(400).json({ error: "AI patch contained no valid content." });
      }

      await commitFile(
        project,
        branch,
        filePath,
        updatedContent,
        `AI created ${filePath}`,
        true
      );
    } else {
      const original = await getFile(project, filePath);
      updatedContent = applyPatchExistingFile(original, diff);

      if (!updatedContent) {
        return res.status(400).json({ error: "Could not patch file" });
      }

      await commitFile(
        project,
        branch,
        filePath,
        updatedContent,
        `AI patched ${filePath}`,
        false
      );
    }

    const mr = await createGitlabMR(
      project,
      branch,
      `AI Fix for Incident ${incident._id}`,
      "Automatically generated fix."
    );

    incident.mergeRequest = {
      id: mr.iid,
      url: mr.web_url,
      branch,
      status: mr.state
    };

    await incident.save();

    return res.json({ success: true, data: { mr }, error: null });
  } catch (err) {
    console.error("MR error:", err.response?.data || err.message);
    next(err);
  }
}

export async function rerunPipeline(req, res, next) {
  try {
    const incident = await Incident.findById(req.params.id);
    if (!incident) {
      return res.status(404).json({
        success: false,
        data: null,
        error: { code: "INCIDENT_NOT_FOUND", message: "Incident not found" }
      });
    }

    // TODO: Use GitLab API to retry pipeline
    res.json({
      success: true,
      data: {
        pipelineId: incident.pipelineId,
        pipelineUrl: incident.pipelineUrl,
        status: "pending"
      },
      error: null
    });
  } catch (err) {
    next(err);
  }
}

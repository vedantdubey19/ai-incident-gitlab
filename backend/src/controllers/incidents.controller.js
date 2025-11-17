import { Incident } from "../models/Incident.js";
import { AIAnalysis } from "../models/AIAnalysis.js";
import { AIPatch } from "../models/AIPatch.js";
import { MergeRequest } from "../models/MergeRequest.js";

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
      .populate("aiPatch")
      .populate("mergeRequest");

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
    const incident = await Incident.findById(req.params.id);
    if (!incident) {
      return res.status(404).json({
        success: false,
        data: null,
        error: { code: "INCIDENT_NOT_FOUND", message: "Incident not found" }
      });
    }

    const analysis = await AIAnalysis.create({
      incident: incident._id,
      summary: "Mock summary from AI",
      rootCause: "Mock root cause",
      category: "other",
      confidence: 0.5
    });

    incident.aiAnalysis = analysis._id;
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
    const incident = await Incident.findById(req.params.id);
    if (!incident) {
      return res.status(404).json({
        success: false,
        data: null,
        error: { code: "INCIDENT_NOT_FOUND", message: "Incident not found" }
      });
    }

    const patch = await AIPatch.create({
      incident: incident._id,
      diff: "diff --git a/file.js b/file.js\n--- a/file.js\n+++ b/file.js\n@@ -1,1 +1,1 @@\n-console.log('old')\n+console.log('new')",
      description: "Mock AI patch",
      riskLevel: "low"
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

export async function createMR(req, res, next) {
  try {
    const incident = await Incident.findById(req.params.id);
    if (!incident) {
      return res.status(404).json({
        success: false,
        data: null,
        error: { code: "INCIDENT_NOT_FOUND", message: "Incident not found" }
      });
    }

    const mr = await MergeRequest.create({
      incident: incident._id,
      mrId: 1,
      mrIid: 1,
      url: "https://gitlab.com/mock/project/-/merge_requests/1",
      branchName: "ai-fix/mock",
      status: "opened",
      lastCheckedAt: new Date()
    });

    incident.mergeRequest = mr._id;
    await incident.save();

    res.json({
      success: true,
      data: { mergeRequest: mr },
      error: null
    });
  } catch (err) {
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

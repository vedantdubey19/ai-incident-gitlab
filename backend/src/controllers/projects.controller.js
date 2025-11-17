import { Project } from "../models/Project.js";
import { fetchGitlabProjectInfo } from "../services/gitlab.service.js";

export async function connectProject(req, res, next) {
  try {
    const { gitlabProjectUrl, gitlabAccessToken, displayName } = req.body;

    if (!gitlabProjectUrl || !gitlabAccessToken) {
      return res.status(400).json({
        success: false,
        data: null,
        error: {
          code: "VALIDATION_ERROR",
          message: "gitlabProjectUrl and gitlabAccessToken are required"
        }
      });
    }

    const existing = await Project.findOne({ gitlabUrl: gitlabProjectUrl });
    if (existing) {
      return res.status(409).json({
        success: false,
        data: null,
        error: {
          code: "PROJECT_ALREADY_CONNECTED",
          message: "This GitLab project is already connected"
        }
      });
    }

    // Call GitLab to get project id + namespace
    const info = await fetchGitlabProjectInfo(gitlabProjectUrl, gitlabAccessToken);

    const project = await Project.create({
      name: displayName || info.name || gitlabProjectUrl,
      gitlabProjectId: info.id,
      gitlabUrl: info.web_url || gitlabProjectUrl,
      gitlabNamespace: info.namespace?.full_path || "",
      gitlabAccessToken
    });

    res.status(201).json({
      success: true,
      data: { project },
      error: null
    });
  } catch (err) {
    next(err);
  }
}

export async function listProjects(req, res, next) {
  try {
    const items = await Project.find().sort({ createdAt: -1 });

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

export async function getProject(req, res, next) {
  try {
    const project = await Project.findById(req.params.id);

    if (!project) {
      return res.status(404).json({
        success: false,
        data: null,
        error: { code: "PROJECT_NOT_FOUND", message: "Project not found" }
      });
    }

    res.json({
      success: true,
      data: { project },
      error: null
    });
  } catch (err) {
    next(err);
  }
}

export async function updateProject(req, res, next) {
  try {
    const updates = req.body;

    const project = await Project.findByIdAndUpdate(
      req.params.id,
      { ...updates },
      { new: true }
    );

    if (!project) {
      return res.status(404).json({
        success: false,
        data: null,
        error: { code: "PROJECT_NOT_FOUND", message: "Project not found" }
      });
    }

    res.json({
      success: true,
      data: { project },
      error: null
    });
  } catch (err) {
    next(err);
  }
}

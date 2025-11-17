import axios from "axios";

const GITLAB_BASE_URL = process.env.GITLAB_BASE_URL || "https://gitlab.com/api/v4";

/**
 * Get GitLab API client for a specific project token
 */
function gitlabClient(token) {
  return axios.create({
    baseURL: GITLAB_BASE_URL,
    headers: {
      "Private-Token": token
    }
  });
}

/**
 * Extract "namespace/project" from a GitLab URL
 * e.g. https://gitlab.com/org/sample-service -> org/sample-service
 */
export function extractProjectPath(gitlabProjectUrl) {
  try {
    const url = new URL(gitlabProjectUrl);
    // remove leading slash
    return url.pathname.replace(/^\/+/, "");
  } catch (e) {
    return null;
  }
}

/**
 * Fetch project info using the URL + token
 */
export async function fetchGitlabProjectInfo(gitlabProjectUrl, token) {
  const path = extractProjectPath(gitlabProjectUrl);
  if (!path) {
    throw new Error("Invalid GitLab project URL");
  }

  const client = gitlabClient(token);
  const encoded = encodeURIComponent(path);

  const res = await client.get(`/projects/${encoded}`);
  return res.data; // contains id, name, namespace, web_url, etc.
}

/**
 * Fetch pipeline details
 */
export async function fetchPipeline(project, pipelineId) {
  const client = gitlabClient(project.gitlabAccessToken);
  const res = await client.get(`/projects/${project.gitlabProjectId}/pipelines/${pipelineId}`);
  return res.data;
}

/**
 * Fetch jobs for a pipeline (optionally filter failed)
 */
export async function fetchPipelineJobs(project, pipelineId) {
  const client = gitlabClient(project.gitlabAccessToken);
  const res = await client.get(
    `/projects/${project.gitlabProjectId}/pipelines/${pipelineId}/jobs`,
    {
      params: {
        per_page: 100
      }
    }
  );
  return res.data; //array
}

export async function fetchJobLog(project, jobId) {
  const client = gitlabClient(project.gitlabAccessToken);
  const res = await client.get(
    `/projects/${project.gitlabProjectId}/jobs/${jobId}/trace`,
    {
      responseType: "text"
    }
  );
  return res.data;
}

export async function fetchGitlabCiConfig(project, ref) {
  const client = gitlabClient(project.gitlabAccessToken);

  try {
    const res = await client.get(
      `/projects/${project.gitlabProjectId}/repository/files/${encodeURIComponent(
        ".gitlab-ci.yml"
      )}/raw`,
      {
        params: { ref }
      }
    );
    return res.data;
  } catch (err) {
    // .gitlab-ci.yml might not exist for some repos
    console.warn("Could not fetch .gitlab-ci.yml:", err.message);
    return null;
  }
}

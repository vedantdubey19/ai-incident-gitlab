import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { api } from "../api";

export default function IncidentDetails() {
  const { id } = useParams();
  const [incident, setIncident] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState("");
  const [error, setError] = useState("");

  async function loadIncident() {
    try {
      setLoading(true);
      const res = await api.getIncident(id);
      setIncident(res.incident);
      setError("");
    } catch (err) {
      setError(err.message || "Failed to load incident");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadIncident();
  }, [id]);

  async function handleAnalysis() {
    try {
      setActionLoading("analysis");
      await api.triggerAnalysis(id);
      await loadIncident();
    } catch (err) {
      setError(err.message || "Failed to run AI analysis");
    } finally {
      setActionLoading("");
    }
  }

  async function handlePatch() {
    try {
      setActionLoading("patch");
      await api.triggerPatch(id);
      await loadIncident();
    } catch (err) {
      setError(err.message || "Failed to generate patch");
    } finally {
      setActionLoading("");
    }
  }

  async function handleCreateMR() {
    try {
      setActionLoading("mr");
      await api.createMR(id);
      await loadIncident();
    } catch (err) {
      setError(err.message || "Failed to create MR");
    } finally {
      setActionLoading("");
    }
  }

  if (loading) return <p>Loading incident...</p>;
  if (error) return <p className="text-red-500">{error}</p>;
  if (!incident) return <p>Incident not found.</p>;

  const aiAnalysis = incident.aiAnalysis;
  const aiPatch = incident.aiPatch;
  const mr = incident.mergeRequest;

  return (
    <div>
      <h2 className="text-xl font-semibold mb-2">
        Incident {incident._id.slice(-6)}
      </h2>
      <p className="mb-2">
        Project: {incident.project?.name || "N/A"} · Pipeline{" "}
        <a
          href={incident.pipelineUrl}
          target="_blank"
          rel="noreferrer"
          className="text-blue-600 underline"
        >
          #{incident.pipelineId}
        </a>
      </p>
      <p className="mb-2">
        Job: <strong>{incident.jobName || "-"}</strong> · Status:{" "}
        <strong>{incident.status}</strong> · Category:{" "}
        <strong>{incident.category || "-"}</strong>
      </p>

      <div className="flex gap-2 my-4">
        <button
          className="border px-3 py-1 text-sm hover:bg-gray-100"
          onClick={handleAnalysis}
          disabled={actionLoading === "analysis"}
        >
          {actionLoading === "analysis" ? "Running analysis..." : "Run AI Analysis"}
        </button>
        <button
          className="border px-3 py-1 text-sm hover:bg-gray-100"
          onClick={handlePatch}
          disabled={actionLoading === "patch"}
        >
          {actionLoading === "patch" ? "Generating patch..." : "Generate AI Patch"}
        </button>
        <button
          className="border px-3 py-1 text-sm hover:bg-gray-100"
          onClick={handleCreateMR}
          disabled={actionLoading === "mr"}
        >
          {actionLoading === "mr" ? "Creating MR..." : "Create MR"}
        </button>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <h3 className="font-semibold mb-1">Error Snippet</h3>
          <pre className="bg-gray-100 p-2 text-xs overflow-auto max-h-48">
            {incident.errorSnippet || "(none)"}
          </pre>

          <h3 className="font-semibold mt-4 mb-1">Logs (truncated)</h3>
          <pre className="bg-gray-100 p-2 text-xs overflow-auto max-h-64">
            {incident.fullLogs || "(no logs stored)"}
          </pre>
        </div>

        <div>
          <h3 className="font-semibold mb-1">AI Analysis</h3>
          {aiAnalysis ? (
            <div className="bg-gray-100 p-2 text-sm space-y-1">
              <p>
                <strong>Summary:</strong> {aiAnalysis.summary}
              </p>
              <p>
                <strong>Root Cause:</strong> {aiAnalysis.rootCause}
              </p>
              <p>
                <strong>Category:</strong> {aiAnalysis.category} ·{" "}
                <strong>Confidence:</strong>{" "}
                {Math.round((aiAnalysis.confidence || 0) * 100)}%
              </p>
            </div>
          ) : (
            <p className="text-sm text-gray-500">
              No AI analysis yet. Click "Run AI Analysis".
            </p>
          )}

          <h3 className="font-semibold mt-4 mb-1">AI Patch</h3>
          {aiPatch ? (
            <pre className="bg-gray-100 p-2 text-xs overflow-auto max-h-64">
              {aiPatch.diff}
            </pre>
          ) : (
            <p className="text-sm text-gray-500">
              No AI patch yet. Click "Generate AI Patch".
            </p>
          )}

          <h3 className="font-semibold mt-4 mb-1">Merge Request</h3>
          {mr ? (
            <p className="text-sm">
              MR:{" "}
              <a
                href={mr.url}
                target="_blank"
                rel="noreferrer"
                className="text-blue-600 underline"
              >
                !{mr.mrIid}
              </a>{" "}
              · Branch: {mr.branchName} · Status: {mr.status}
            </p>
          ) : (
            <p className="text-sm text-gray-500">
              No MR yet. Click "Create MR" after patch is generated.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

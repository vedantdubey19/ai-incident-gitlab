import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api";

export default function Incidents() {
  const [incidents, setIncidents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        const res = await api.getIncidents();
        setIncidents(res.items || []);
      } catch (err) {
        setError(err.message || "Failed to load incidents");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  if (loading) return <p>Loading incidents...</p>;
  if (error) return <p className="text-red-500">{error}</p>;

  if (!incidents.length) {
    return <p>No incidents yet. Break your pipeline to see them here.</p>;
  }

  return (
    <div>
      <h2 className="text-xl font-semibold mb-4">Incidents</h2>
      <table className="w-full border text-sm">
        <thead>
          <tr className="bg-gray-100">
            <th className="border px-2 py-1">ID</th>
            <th className="border px-2 py-1">Project</th>
            <th className="border px-2 py-1">Pipeline</th>
            <th className="border px-2 py-1">Job</th>
            <th className="border px-2 py-1">Status</th>
            <th className="border px-2 py-1">Category</th>
            <th className="border px-2 py-1">Created</th>
            <th className="border px-2 py-1">Actions</th>
          </tr>
        </thead>
        <tbody>
          {incidents.map((inc) => (
            <tr key={inc._id}>
              <td className="border px-2 py-1 text-xs">
                {inc._id.slice(-6)}
              </td>
              <td className="border px-2 py-1">
                {inc.project?.name || "N/A"}
              </td>
              <td className="border px-2 py-1">
                <a
                  href={inc.pipelineUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="text-blue-600 underline"
                >
                  #{inc.pipelineId}
                </a>
              </td>
              <td className="border px-2 py-1">{inc.jobName || "-"}</td>
              <td className="border px-2 py-1">{inc.status}</td>
              <td className="border px-2 py-1">{inc.category || "-"}</td>
              <td className="border px-2 py-1">
                {new Date(inc.createdAt).toLocaleString()}
              </td>
              <td className="border px-2 py-1">
                <Link
                  to={`/incidents/${inc._id}`}
                  className="text-blue-600 underline"
                >
                  View
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
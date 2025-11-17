import { useParams } from "react-router-dom";

export default function IncidentDetails() {
  const { id } = useParams();

  return (
    <div>
      <h2 className="text-xl font-semibold mb-4">Incident {id}</h2>
      <p>Logs, AI analysis, and patch details will show here.</p>
    </div>
  );
}

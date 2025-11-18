import { Routes, Route, Link } from "react-router-dom";
import Dashboard from "./pages/Dashboard.jsx";
import Projects from "./pages/Projects.jsx";
import IncidentDetails from "./pages/IncidentDetails.jsx";
import Incidents from "./pages/Incidents.jsx";

export default function App() {
  return (
    <div className="min-h-screen flex">
      <aside className="w-64 border-r p-4">
        <h1 className="font-bold text-lg mb-4">AI Incident Copilot</h1>
        <nav className="flex flex-col gap-2">
          <Link to="/">Dashboard</Link>
          <Link to="/projects">Projects</Link>
          <Link to="/incidents">Incidents</Link>
        </nav>
      </aside>

      <main className="flex-1 p-6">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/projects" element={<Projects />} />
          <Route path="/incidents" element={<Incidents />} />
          <Route path="/incidents/:id" element={<IncidentDetails />} />
        </Routes>
      </main>
    </div>
  );
}

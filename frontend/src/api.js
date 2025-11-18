const BASE_URL = "http://localhost:4000/api"; // or your ngrok/base

async function request(path, options = {}) {
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {})
    },
    ...options
  });
  const data = await res.json();
  if (!data.success) {
    throw new Error(data.error?.message || "Request failed");
  }
  return data.data;
}

export const api = {
  getIncidents: () => request("/incidents"),
  getIncident: (id) => request(`/incidents/${id}`),
  triggerAnalysis: (id) =>
    request(`/incidents/${id}/analysis`, { method: "POST" }),
  triggerPatch: (id) =>
    request(`/incidents/${id}/patch`, { method: "POST" }),
  createMR: (id) =>
    request(`/incidents/${id}/create-mr`, { method: "POST" })
};
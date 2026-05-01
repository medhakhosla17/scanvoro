const API_BASE = import.meta.env.VITE_API_BASE || "/api";

export async function postJson(path, payload, fallbackMessage) {
  try {
    const response = await fetch(`${API_BASE}${path}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || fallbackMessage);
    }

    return data;
  } catch (error) {
    if (error instanceof TypeError) {
      throw new Error("Cannot reach the Scanvoro backend. Start the backend server on port 5000 and try again.");
    }

    throw error;
  }
}

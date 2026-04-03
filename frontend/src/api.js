// In production, VITE_API_URL points to the backend (e.g. https://mood-music-api.up.railway.app)
// In development, it falls back to /api which Vite proxies to localhost:3001
const API_BASE = import.meta.env.VITE_API_URL || "/api";

export async function generatePlaylist(mood, language) {
  const url = `${API_BASE}/generate-playlist`;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 30000);

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ mood, language }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    const data = await response.json();

    if (!response.ok) {
      const err = new Error(data.error || `Request failed (${response.status})`);
      err.status = response.status;
      err.remaining = data.remaining;
      err.limit = data.limit;
      throw err;
    }

    return data;
  } catch (error) {
    clearTimeout(timeoutId);

    if (error.name === "AbortError") {
      throw new Error("Request timed out. Please try again.");
    }

    if (!navigator.onLine) {
      throw new Error("No internet connection. Check your network.");
    }

    throw error;
  }
}

export async function getUsage() {
  try {
    const response = await fetch(`${API_BASE}/usage`);
    if (!response.ok) return null;
    return await response.json();
  } catch {
    return null;
  }
}

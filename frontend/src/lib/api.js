
const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

export async function apiRequest(path, options = {}) {
  const token = localStorage.getItem("token");

  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });

  const result = await response.json().catch(() => ({}));

  if (
    response.status === 403 &&
    result.code === "PASSWORD_CHANGE_REQUIRED"
  ) {
    window.location.assign("/change-password");
    throw new Error("PASSWORD_CHANGE_REQUIRED");
  }

  if (!response.ok) {
    throw new Error(result.message || "Terjadi kesalahan pada server");
  }

  return result;
}

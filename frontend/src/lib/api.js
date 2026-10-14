import axios from "axios";

export const API = `${process.env.REACT_APP_BACKEND_URL || ""}/api`;

export const api = axios.create({ baseURL: API });

api.interceptors.request.use((cfg) => {
  const t = localStorage.getItem("erank_token");
  if (t) cfg.headers.Authorization = `Bearer ${t}`;
  return cfg;
});

// ==============================================================================
// [GLOBAL ERROR HANDLING INTERCEPTOR]
// Extracts error messages from FastAPI HTTPException responses.
// Returns a human-readable string rendered by Sonner toast alerts across all dashboards.
// ==============================================================================
export function apiError(e) {
  // Step 1: Extract backend error payload detail
  const d = e?.response?.data?.detail;
  // Step 2: If backend returned a simple string detail (e.g., "Too far from rank")
  if (typeof d === "string") return d;
  // Step 3: If backend returned an array of validation errors (Pydantic 422)
  if (Array.isArray(d)) return d.map((x) => x.msg || JSON.stringify(x)).join(" ");
  // Step 4: If backend returned an object with a msg field
  if (d && typeof d.msg === "string") return d.msg;
  // Step 5: Fallback to standard Axios network error or friendly generic message
  return e?.message || "Something went wrong. Please try again.";
}


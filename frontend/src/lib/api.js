import axios from "axios";

export const API = `${process.env.REACT_APP_BACKEND_URL || ""}/api`;

export const api = axios.create({ baseURL: API });

api.interceptors.request.use((cfg) => {
  const t = localStorage.getItem("erank_token");
  if (t) cfg.headers.Authorization = `Bearer ${t}`;
  return cfg;
});

export function apiError(e) {
  const d = e?.response?.data?.detail;
  if (typeof d === "string") return d;
  if (Array.isArray(d)) return d.map((x) => x.msg || JSON.stringify(x)).join(" ");
  if (d && typeof d.msg === "string") return d.msg;
  return e?.message || "Something went wrong. Please try again.";
}

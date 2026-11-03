export const BACKEND_URL = import.meta.env.DEV
  ? import.meta.env.VITE_BACKEND_URL || "http://localhost:5000"
  : import.meta.env.VITE_BACKEND_URL && !import.meta.env.VITE_BACKEND_URL.includes("localhost")
    ? import.meta.env.VITE_BACKEND_URL
    : "";

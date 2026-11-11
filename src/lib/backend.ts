// The API lives on the same site (src/routes/api), so requests go to the site's own address.
// Set VITE_BACKEND_URL only to point the pages at an API hosted somewhere else.
export const BACKEND_URL: string = import.meta.env.VITE_BACKEND_URL || "";

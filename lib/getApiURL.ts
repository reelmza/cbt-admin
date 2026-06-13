export function getApiUrl(): string {
  if (typeof window === "undefined") {
    return process.env.SERVER_BASEURL || "http://server:4000/api/v1";
  }

  const { hostname, protocol, port } = window.location;

  // Cloud: standard ports (no port or 80/443) → nginx proxies /api/v1
  if (!port || port === "80" || port === "443") {
    return `${protocol}//${hostname}/api/v1`;
  }

  // Exam hall: frontend on port 3000/7000 → backend on port 4000
  return `http://${hostname}:4000/api/v1`;
}

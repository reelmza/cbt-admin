import { headers } from "next/headers";

// Server-side read of the runtime school identity.
//
// We read process.env directly rather than HTTP-fetching /api/config: a
// server-side self-fetch via the public host fails under Docker port-mapping
// (e.g. inside the container nothing listens on the published port like :7000,
// so the request is refused and the theme falls back to "default"). The server
// already has the env at runtime — /api/config exists only for the client bundle,
// which can't read server env.
//
// Touching headers() opts this into dynamic (per-request) rendering, so the value
// is read at runtime in the container instead of being baked as "default" during
// `next build`, where SCHOOL_NAME is unset.
export async function fetchSchoolName(): Promise<string | null> {
  await headers();
  return process.env.SCHOOL_NAME ?? null;
}

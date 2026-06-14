import { headers } from "next/headers";

// Server-side read of the runtime school identity from /api/config.
// Used during SSR so the school logo/name/theme render correctly on first paint
// (no flicker) and reflect the per-deployment runtime config rather than a
// build-time value. Deduped by React request memoization across consumers.
export async function fetchSchoolName(): Promise<string | null> {
  try {
    const headerList = await headers();
    const host = headerList.get("host");
    const protocol = headerList.get("x-forwarded-proto") ?? "http";
    const res = await fetch(`${protocol}://${host}/api/config`, {
      cache: "no-store",
    });
    const { schoolName } = await res.json();
    return schoolName ?? null;
  } catch {
    return null;
  }
}

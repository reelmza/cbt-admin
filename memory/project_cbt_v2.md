---
name: project-cbt-v2
description: CBT V2 — Next.js offline exam portal for Nigerian tertiary institutions. Key conventions and architectural decisions.
metadata:
  type: project
---

Next.js App Router project (`output: standalone`) for managing CBT exams in Nigerian universities.

**Key conventions:**
- Pages use `use(params)` + `SessionProvider` wrapper pattern for dynamic routes
- Loading state uses string keys (`"page"`, `"pageError"`, `null`) with `<Preload>` component at bottom of page
- Errors in PATCH/POST operations use `toast.error(error?.response?.data?.message || error?.message, toastConfig)` and reset loading to `null` (not `"pageError"`)
- `useEffect` requests define their own `const controller = new AbortController()` inside the effect; standalone async functions outside useEffect use `const globalController = new AbortController()`
- Custom `Input` component at `@/components/input` is preferred over shadcn `Input` — requires `type` prop
- Dynamic local images use `unoptimized` prop on `next/image` to bypass the optimization API (no sharp installed)
- 401 errors are caught globally via Axios interceptor in `lib/axios.ts` and surface a `SessionExpiredOverlay`

**SCHOOL_NAME env var:**
- Server-side only (no NEXT_PUBLIC_ prefix), read in Server Components
- Logo convention: `/public/images/{schoolName}-logo-auth.webp` (login) and `/public/images/{schoolName}-logo.png` (sidebar)
- Passed from layout → SideBar and from page.tsx → SideBox as props

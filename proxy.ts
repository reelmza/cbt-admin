import { auth } from "./auth";
import { canAccessRoute, landingRoute } from "./lib/access";

export default auth((req) => {
  const role = req.auth?.user?.role;

  // If no auth and user is on an auth requiring page
  if (
    !(
      req.nextUrl.pathname === "/" ||
      req.nextUrl.pathname === "/set-password" ||
      req.nextUrl.pathname === "/reset-password" ||
      req.nextUrl.pathname.includes("/signup") ||
      req.nextUrl.pathname.includes("/login")
    ) &&
    !req.auth
  ) {
    const newUrl = new URL("/", req.nextUrl.origin);
    return Response.redirect(newUrl);
  }

  // If auth and user is trying to visit preauth page
  if (
    (req.nextUrl.pathname === "/" ||
      req.nextUrl.pathname.includes("/set-password") ||
      req.nextUrl.pathname.includes("/login") ||
      req.nextUrl.pathname.includes("/signup")) &&
    req.auth
  ) {
    const newUrl = new URL(landingRoute(role), req.nextUrl.origin);
    return Response.redirect(newUrl);
  }

  // Signed in, but this role may not open this area. Enforced here rather than
  // only hiding the link, so a typed-in URL is turned away too.
  if (req.auth && !canAccessRoute(role, req.nextUrl.pathname)) {
    const newUrl = new URL(landingRoute(role), req.nextUrl.origin);
    return Response.redirect(newUrl);
  }
});

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};

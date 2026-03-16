import { auth } from "./auth";

export default auth((req) => {
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
    const newUrl = new URL("/dashboard", req.nextUrl.origin);
    console.log(newUrl, "from proxy");
    return Response.redirect(newUrl);
  }
});

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};

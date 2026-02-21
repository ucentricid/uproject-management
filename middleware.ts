import NextAuth from "next-auth"
import authConfig from "@/auth.config"

const { auth } = NextAuth(authConfig)

export default auth((req) => {
    // NextAuth/Auth.js often has issues behind proxies unless trustHost is explicitly handled
    // Or normally, we set AUTH_TRUST_HOST in .env, but setting it explicitly is safer.
    const isLoggedIn = !!req.auth
    const nextUrl = req.nextUrl

    console.log(`[Middleware] Path: ${nextUrl.pathname}, isLoggedIn: ${isLoggedIn}, auth: ${JSON.stringify(req.auth)}`);

    const isApiAuthRoute = nextUrl.pathname.startsWith("/api/auth")
    const isPublicRoute = ["/"].includes(nextUrl.pathname)
    const isAuthRoute = ["/auth/login", "/auth/register"].includes(nextUrl.pathname)

    if (isApiAuthRoute) {
        return null
    }

    if (isAuthRoute) {
        if (isLoggedIn) {
            return Response.redirect(new URL("/dashboard", nextUrl))
        }
        return null
    }

    if (!isLoggedIn && !isPublicRoute) {
        return Response.redirect(new URL("/auth/login", nextUrl))
    }

    return null
})

// Optionally, don't invoke Middleware on some paths
export const config = {
    matcher: ["/((?!.+\\.[\\w]+$|_next).*)", "/", "/(api|trpc)(.*)"],
}

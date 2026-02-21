import NextAuth from "next-auth"
import authConfig from "@/auth.config"

const { auth } = NextAuth(authConfig)

export default auth((req) => {
    const isLoggedIn = !!req.auth
    const nextUrl = req.nextUrl
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

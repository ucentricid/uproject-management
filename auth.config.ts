import type { NextAuthConfig } from "next-auth";
import Google from "next-auth/providers/google";
import Credentials from "next-auth/providers/credentials";

import { LoginSchema } from "@/schemas";

// Notice this is only an object, not a full Auth.js instance
export default {
    providers: [],
    pages: {
        signIn: "/auth/login",
    },
    session: { strategy: "jwt" },
    trustHost: true,
    secret: process.env.AUTH_SECRET,
} satisfies NextAuthConfig;

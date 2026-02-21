"use server";

import * as z from "zod";
import { AuthError } from "next-auth";

import { signIn } from "@/auth";
import { LoginSchema } from "@/schemas";
import { DEFAULT_LOGIN_REDIRECT } from "@/routes";

export const login = async (values: z.infer<typeof LoginSchema>) => {
    console.log("Login action called with:", values.email);
    const validatedFields = LoginSchema.safeParse(values);

    if (!validatedFields.success) {
        return { error: "Invalid fields!" };
    }

    const { email, password } = validatedFields.data;

    try {
        await signIn("credentials", {
            email,
            password,
            redirectTo: DEFAULT_LOGIN_REDIRECT,
        });
    } catch (error: any) {
        if (error instanceof AuthError) {
            console.error("AuthError:", error.type, error.message, error.cause);
            switch (error.type) {
                case "CredentialsSignin":
                    return { error: "Invalid credentials!" };
                default:
                    return { error: "Something went wrong! Error: " + error.type };
            }
        }

        // If NextAuth successfully signs in, it often immediately throws a Next.js redirect error.
        // We catch it and suppress it so we can execute the redirect on the client-side safely instead, overcoming any reverse proxy header-stripping.
        if (
            (error instanceof Error && error.message === "NEXT_REDIRECT") ||
            (error && typeof error === 'object' && 'digest' in error && typeof error.digest === 'string' && error.digest.startsWith("NEXT_REDIRECT"))
        ) {
            console.log("Suppressed NEXT_REDIRECT. Returning success to client.");
            return { success: "Logged in!", redirectTo: DEFAULT_LOGIN_REDIRECT };
        }

        console.error("CRITICAL SIGNIN ERROR:", error);
        return { error: "System Error: " + (error?.message || "Unknown error") };
    }

    return { success: "Logged in!", redirectTo: DEFAULT_LOGIN_REDIRECT };
};

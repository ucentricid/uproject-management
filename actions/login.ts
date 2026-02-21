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

        // In Next.js, redirect() throws an error. Auth.js also throws redirect errors. 
        // We have to re-throw these type of errors so Next.js can handle the redirect response.
        if (error instanceof Error && error.message === "NEXT_REDIRECT") {
            throw error;
        }
        if (error && typeof error === 'object' && 'digest' in error && typeof error.digest === 'string' && error.digest.startsWith("NEXT_REDIRECT")) {
            throw error;
        }

        console.error("CRITICAL SIGNIN ERROR:", error);
        return { error: "System Error: " + (error.message || "Unknown error") };
    }
};

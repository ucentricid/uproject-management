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
            redirect: false,
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

        console.error("CRITICAL SIGNIN ERROR:", error);
        return { error: "System Error: " + (error?.message || "Unknown error") };
    }

    // Instead of throwing a Next.js redirect from the server action (which gets caught by the client Promise .catch),
    // we return the success state and url. The client form will handle the navigation.
    return { success: "Logged in!", redirectTo: DEFAULT_LOGIN_REDIRECT };
};

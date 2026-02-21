import NextAuth from "next-auth"
import { PrismaAdapter } from "@auth/prisma-adapter"
import { db } from "@/lib/db"
import authConfig from "@/auth.config"
import { getUserByEmail } from "@/data/user"
import Credentials from "next-auth/providers/credentials"
import { LoginSchema } from "@/schemas"
import bcrypt from "bcryptjs"

export const {
    handlers: { GET, POST },
    auth,
    signIn,
    signOut,
} = NextAuth({
    callbacks: {
        async session({ session, token }) {
            console.log("Session Callback:", { session, token });
            if (token.sub && session.user) {
                session.user.id = token.sub;
            }
            if (token.role && session.user) {
                session.user.role = token.role as "ADMIN" | "MEMBER";
            }
            return session;
        },
        async signIn({ user, account }) {
            // Allow OAuth without email verification
            if (account?.provider !== "credentials") {
                return true;
            }

            const existingUser = await getUserByEmail(user.email!);

            // Prevent sign in without email verification (if applicable)
            // if (!existingUser?.emailVerified) return false;

            return true;
        },
        async jwt({ token }) {
            if (!token.sub) return token;

            const user = await getUserByEmail(token.email!);
            if (!user) return token;

            token.role = user.role;
            console.log("JWT Callback:", { token });
            return token;
        }
    },
    adapter: PrismaAdapter(db),
    session: { strategy: "jwt" },
    ...authConfig,
    providers: [
        ...authConfig.providers,
        Credentials({
            async authorize(credentials) {
                console.log("Authorize callback called with:", { email: credentials?.email });
                const validatedFields = LoginSchema.safeParse(credentials);

                if (validatedFields.success) {
                    const { email, password } = validatedFields.data;

                    const user = await getUserByEmail(email);
                    if (!user || !user.password) {
                        console.log("User not found or no password");
                        return null;
                    }

                    const passwordsMatch = await bcrypt.compare(
                        password,
                        user.password,
                    );

                    if (passwordsMatch) {
                        console.log("Passwords match, returning user:", user.id);
                        return user;
                    }
                    console.log("Passwords do not match");
                } else {
                    console.log("Validation failed");
                }

                return null;
            }
        }),
    ],
    trustHost: true,
})

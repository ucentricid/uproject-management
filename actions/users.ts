"use server";

import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { auth } from "@/auth";
import { getUserByEmail } from "@/data/user";
import { UserUpdateSchema } from "@/schemas";
import * as z from "zod";

export const getUsers = async () => {
    const session = await auth();

    if (!session?.user?.id) {
        return [];
    }

    const users = await db.user.findMany({
        orderBy: { name: "asc" },
        select: {
            id: true,
            name: true,
            email: true,
            role: true,
        },
    });

    return users;
};

export const createUser = async (data: {
    name: string;
    email: string;
    password?: string;
    role: "ADMIN" | "MEMBER";
}) => {
    const session = await auth();

    if (!session?.user?.id) {
        return { error: "Unauthorized" };
    }

    const existingUser = await getUserByEmail(data.email);
    if (existingUser) {
        return { error: "Email already in use!" };
    }

    const passwordToUse = data.password || "#Passw0rdPassw0rd";
    const hashedPassword = await bcrypt.hash(passwordToUse, 10);

    const user = await db.user.create({
        data: {
            name: data.name,
            email: data.email,
            password: hashedPassword,
            role: data.role,
        },
        select: {
            id: true,
            name: true,
            email: true,
            role: true,
        },
    });

    return { success: "User created!", user };
};

export const deleteUser = async (userId: string) => {
    const session = await auth();

    if (!session?.user?.id) {
        return { error: "Unauthorized" };
    }

    // Prevent deleting yourself
    if (userId === session.user.id) {
        return { error: "Cannot delete your own account!" };
    }

    await db.user.delete({
        where: { id: userId },
    });

    return { success: "User deleted!" };
};

export const updateUserRole = async (userId: string, role: "ADMIN" | "MEMBER") => {
    const session = await auth();

    if (!session?.user?.id) {
        return { error: "Unauthorized" };
    }

    const user = await db.user.update({
        where: { id: userId },
        data: { role },
        select: {
            id: true,
            name: true,
            email: true,
            role: true,
        },
    });

    return { success: "Role updated!", user };
};

export const updateUser = async (userId: string, values: z.infer<typeof UserUpdateSchema>) => {
    const session = await auth();

    if (!session?.user?.id) {
        return { error: "Unauthorized" };
    }

    const validatedFields = UserUpdateSchema.safeParse(values);

    if (!validatedFields.success) {
        return { error: "Invalid fields!" };
    }

    const { name, email, role, password } = validatedFields.data;

    // Optional: Add check if current user is ADMIN, but role based UI and middleware should cover it.
    // For extra safety:
    if (session.user.role !== "ADMIN") {
        return { error: "Forbidden" };
    }

    let dataToUpdate: any = { name, role };

    if (email) {
        // Check if email is already taken by another user
        const existingUser = await getUserByEmail(email);
        if (existingUser && existingUser.id !== userId) {
            return { error: "Email already in use!" };
        }
        dataToUpdate.email = email;
    }

    if (password) {
        const hashedPassword = await bcrypt.hash(password, 10);
        dataToUpdate.password = hashedPassword;
    }

    const user = await db.user.update({
        where: { id: userId },
        data: dataToUpdate,
        select: {
            id: true,
            name: true,
            email: true,
            role: true,
        },
    });

    return { success: "User updated!", user };
};

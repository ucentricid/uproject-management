"use server";

import { db } from "@/lib/db";
import { auth } from "@/auth";

export const addProjectMember = async (projectId: string, userId: string) => {
    const session = await auth();

    if (!session?.user?.id) {
        return { error: "Unauthorized" };
    }

    const project = await db.project.findUnique({
        where: { id: projectId },
    });

    if (!project || project.ownerId !== session.user.id) {
        return { error: "Only the project owner can add members" };
    }

    await db.project.update({
        where: { id: projectId },
        data: {
            members: {
                connect: { id: userId },
            },
        },
    });

    return { success: "Member added!" };
};

export const removeProjectMember = async (projectId: string, userId: string) => {
    const session = await auth();

    if (!session?.user?.id) {
        return { error: "Unauthorized" };
    }

    const project = await db.project.findUnique({
        where: { id: projectId },
    });

    if (!project || project.ownerId !== session.user.id) {
        return { error: "Only the project owner can remove members" };
    }

    await db.project.update({
        where: { id: projectId },
        data: {
            members: {
                disconnect: { id: userId },
            },
        },
    });

    return { success: "Member removed!" };
};

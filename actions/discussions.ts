"use server";

import { db } from "@/lib/db";
import { auth } from "@/auth";

// Check if user is project owner or member
const isProjectParticipant = async (projectId: string, userId: string) => {
    const project = await db.project.findUnique({
        where: { id: projectId },
        include: {
            members: { select: { id: true } },
        },
    });

    if (!project) return false;
    if (project.ownerId === userId) return true;
    return project.members.some(m => m.id === userId);
};

export const getDiscussions = async (projectId: string) => {
    const session = await auth();

    if (!session?.user?.id) {
        return [];
    }

    const hasAccess = await isProjectParticipant(projectId, session.user.id);
    if (!hasAccess) {
        return [];
    }

    const discussions = await db.discussion.findMany({
        where: {
            projectId,
            parentId: null,
        },
        orderBy: { createdAt: "desc" },
        include: {
            user: {
                select: { id: true, name: true, email: true },
            },
            replies: {
                orderBy: { createdAt: "asc" },
                include: {
                    user: {
                        select: { id: true, name: true, email: true },
                    },
                    replies: {
                        orderBy: { createdAt: "asc" },
                        include: {
                            user: {
                                select: { id: true, name: true, email: true },
                            },
                        },
                    },
                },
            },
        },
    });

    return discussions;
};

export const createDiscussion = async (projectId: string, content: string, parentId?: string) => {
    const session = await auth();

    if (!session?.user?.id) {
        return { error: "Unauthorized" };
    }

    const hasAccess = await isProjectParticipant(projectId, session.user.id);
    if (!hasAccess) {
        return { error: "Only project owner and assigned members can discuss" };
    }

    const discussion = await db.discussion.create({
        data: {
            content,
            projectId,
            userId: session.user.id,
            parentId: parentId || null,
        },
        include: {
            user: {
                select: { id: true, name: true, email: true },
            },
            replies: {
                include: {
                    user: {
                        select: { id: true, name: true, email: true },
                    },
                },
            },
        },
    });

    return { success: "Comment posted!", discussion };
};

export const deleteDiscussion = async (discussionId: string) => {
    const session = await auth();

    if (!session?.user?.id) {
        return { error: "Unauthorized" };
    }

    const discussion = await db.discussion.findUnique({
        where: { id: discussionId },
    });

    if (!discussion || discussion.userId !== session.user.id) {
        return { error: "You can only delete your own comments" };
    }

    await db.discussion.delete({
        where: { id: discussionId },
    });

    return { success: "Comment deleted!" };
};

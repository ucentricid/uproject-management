"use server";

import { db } from "@/lib/db";
import { auth } from "@/auth";
import { sendMail } from "@/lib/mail";

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

    try {
        const project = await db.project.findUnique({
            where: { id: projectId },
            select: { name: true },
        });

        // Format content to remove IDs from mentions: @[Name](Id) -> @Name
        const displayContent = content.replace(/@\[([^\]]+)\]\([^)]+\)/g, '@$1');

        // 1. Notify Parent User (if it's a reply)
        let parentUserId: string | null = null;
        if (parentId) {
            const parentDiscussion = await db.discussion.findUnique({
                where: { id: parentId },
                select: { userId: true, user: { select: { email: true, name: true } } }
            });

            if (parentDiscussion && parentDiscussion.userId !== session.user.id && parentDiscussion.user?.email) {
                parentUserId = parentDiscussion.userId;
                await sendMail({
                    to: parentDiscussion.user.email,
                    subject: `New reply on your comment in ${project?.name || 'Project'}`,
                    html: `
                        <p>Hi ${parentDiscussion.user.name || 'there'},</p>
                        <p><strong>${discussion.user.name || 'Someone'}</strong> replied to your comment:</p>
                        <blockquote style="border-left: 4px solid #ccc; padding-left: 10px; color: #555;">
                            ${displayContent}
                        </blockquote>
                        <p>Log in to your account to view the full discussion.</p>
                    `
                });
            }
        }

        // 2. Notify Mentioned Users
        // Extract mentions using regex: @[Name](UserId)
        const mentionRegex = /@\[([^\]]+)\]\(([^)]+)\)/g;
        let match;
        const mentionedUserIds = new Set<string>();

        while ((match = mentionRegex.exec(content)) !== null) {
            mentionedUserIds.add(match[2]);
        }

        // Remove the creator and the parent user (if already notified) from mentions
        mentionedUserIds.delete(session.user.id);
        if (parentUserId) {
            mentionedUserIds.delete(parentUserId);
        }

        if (mentionedUserIds.size > 0) {
            const mentionedUsers = await db.user.findMany({
                where: { id: { in: Array.from(mentionedUserIds) } },
                select: { email: true, name: true },
            });

            const emailPromises = mentionedUsers
                .filter(u => u.email)
                .map(user =>
                    sendMail({
                        to: user.email!,
                        subject: `You were mentioned in ${project?.name || 'Project'}`,
                        html: `
                            <p>Hi ${user.name || 'there'},</p>
                            <p><strong>${discussion.user.name || 'Someone'}</strong> mentioned you in a discussion:</p>
                            <blockquote style="border-left: 4px solid #ccc; padding-left: 10px; color: #555;">
                                ${displayContent}
                            </blockquote>
                            <p>Log in to your account to view the full discussion.</p>
                        `
                    })
                );

            await Promise.allSettled(emailPromises);
        }
    } catch (error) {
        console.error("Failed to send discussion notifications", error);
    }

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

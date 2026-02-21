"use server";

import * as z from "zod";
import { db } from "@/lib/db";
import { ProjectSchema } from "@/schemas";
import { auth } from "@/auth";

export const createProject = async (values: z.infer<typeof ProjectSchema>, memberIds?: string[]) => {
    const session = await auth();

    if (!session?.user?.id) {
        return { error: "Unauthorized" };
    }

    const validatedFields = ProjectSchema.safeParse(values);

    if (!validatedFields.success) {
        return { error: "Invalid fields!" };
    }

    const { name, description } = validatedFields.data;

    // Auto-generate key from project name: take up to 4 uppercase letters, strip spaces/special chars
    const generateKey = async (): Promise<string> => {
        const base = name
            .toUpperCase()
            .replace(/[^A-Z0-9]/g, "")
            .slice(0, 4) || "PROJ";

        let candidate = base;
        let attempt = 0;
        while (true) {
            const suffix = attempt === 0 ? "" : String(attempt);
            candidate = (base + suffix).slice(0, 6);
            const existing = await db.project.findUnique({ where: { key: candidate } });
            if (!existing) return candidate;
            attempt++;
        }
    };

    const key = await generateKey();

    const project = await db.project.create({
        data: {
            name,
            key,
            description,
            ownerId: session.user.id,
            columns: {
                create: [
                    { name: "To Do", order: 0 },
                    { name: "In Progress", order: 1 },
                    { name: "Done", order: 2 },
                ]
            },
            members: memberIds && memberIds.length > 0 ? {
                connect: memberIds.map(id => ({ id })),
            } : undefined,
        },
    });

    return { success: "Project created!", project };
};

export const getProjects = async () => {
    const session = await auth();

    if (!session?.user?.id) {
        return [];
    }

    const projects = await db.project.findMany({
        where: {
            OR: [
                { ownerId: session.user.id },
                { members: { some: { id: session.user.id } } },
            ],
        },
        orderBy: {
            createdAt: "desc",
        },
        include: {
            members: {
                select: { id: true, name: true, email: true },
            },
        },
    });

    return projects;
};

export const getProject = async (projectId: string) => {
    const session = await auth();

    if (!session?.user?.id) {
        return null;
    }

    const project = await db.project.findUnique({
        where: {
            id: projectId,
        },
        include: {
            columns: {
                orderBy: {
                    order: "asc",
                },
                include: {
                    issues: {
                        orderBy: {
                            order: "asc",
                        },
                        include: {
                            assignee: true,
                        }
                    }
                }
            },
            members: {
                select: { id: true, name: true, email: true },
            },
            owner: {
                select: { id: true, name: true, email: true },
            },
            discussions: {
                take: 1,
                select: { id: true },
            },
        },
    });

    return project;
};

export const updateProject = async (projectId: string, values: z.infer<typeof ProjectSchema>) => {
    const session = await auth();

    if (!session?.user?.id) {
        return { error: "Unauthorized" };
    }

    const validatedFields = ProjectSchema.safeParse(values);

    if (!validatedFields.success) {
        return { error: "Invalid fields!" };
    }

    const { name, key, description } = validatedFields.data;

    const existingProject = await db.project.findUnique({
        where: { id: projectId },
    });

    if (!existingProject) {
        return { error: "Project not found!" };
    }

    if (existingProject.ownerId !== session.user.id) {
        return { error: "Only the project owner can edit this project!" };
    }

    await db.project.update({
        where: { id: projectId },
        data: {
            name,
            description,
            // Key is generally not editable as it might break URLs, but schema allows it. 
            // If user wants to edit key, we need to check uniqueness again.
            // For now let's assume key is immutable or check if changed.
        },
    });

    return { success: "Project updated!" };
};

export const deleteProject = async (projectId: string) => {
    const session = await auth();

    if (!session?.user?.id) {
        return { error: "Unauthorized" };
    }

    try {
        // Run ownership check, issue count, and discussion count in parallel
        const [project, issueCount, discussionCount] = await Promise.all([
            db.project.findUnique({ where: { id: projectId }, select: { ownerId: true } }),
            db.issue.count({ where: { projectId } }),
            db.discussion.count({ where: { projectId } }),
        ]);

        if (!project) return { error: "Project not found!" };
        if (project.ownerId !== session.user.id) return { error: "Only the project owner can delete this project!" };
        if (issueCount > 0) return { error: "Tidak bisa dihapus: project masih memiliki issue di board." };
        if (discussionCount > 0) return { error: "Tidak bisa dihapus: project masih memiliki diskusi." };

        // Delete everything in one transaction
        await db.$transaction([
            db.boardColumn.deleteMany({ where: { projectId } }),
            db.project.delete({ where: { id: projectId } }),
        ]);

        return { success: "Project deleted!" };
    } catch (err) {
        console.error("deleteProject error:", err);
        return { error: "Terjadi kesalahan saat menghapus project. Coba lagi." };
    }
};

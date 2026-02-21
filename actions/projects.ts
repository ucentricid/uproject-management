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

    const { name, key, description } = validatedFields.data;

    const existingProject = await db.project.findUnique({
        where: { key },
    });

    if (existingProject) {
        return { error: "Project key already in use!" };
    }

    await db.project.create({
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

    return { success: "Project created!" };
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

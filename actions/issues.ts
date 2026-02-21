"use server";

import * as z from "zod";
import { db } from "@/lib/db";
import { IssueSchema, IssueUpdateSchema } from "@/schemas";
import { auth } from "@/auth";
import { deleteAttachmentFromS3 } from "@/actions/upload";

export const createIssue = async (values: z.infer<typeof IssueSchema> & { columnId?: string }) => {
    const session = await auth();
    console.log("createIssue called by:", session?.user?.id, "for project:", values.projectId);

    if (!session?.user?.id) {
        return { error: "Unauthorized" };
    }

    const validatedFields = IssueSchema.safeParse(values);

    if (!validatedFields.success) {
        return { error: "Invalid fields!" };
    }

    const { title, description, projectId, priority, type, status, dueDate, attachmentUrl, attachmentName } = validatedFields.data;
    const columnId = values.columnId;

    // Verify project exists
    const project = await db.project.findUnique({
        where: { id: projectId },
    });

    if (!project) {
        return { error: "Project not found!" };
    }

    // If no columnId provided, find the first column of this project
    let targetColumnId = columnId;
    if (!targetColumnId) {
        const firstColumn = await db.boardColumn.findFirst({
            where: { projectId },
            orderBy: { order: "asc" },
        });
        targetColumnId = firstColumn?.id;
    }

    // Get the highest order in the target column
    const lastIssue = await db.issue.findFirst({
        where: {
            columnId: targetColumnId,
        },
        orderBy: {
            order: "desc",
        },
    });

    const newOrder = lastIssue ? lastIssue.order + 1 : 0;

    const issue = await db.issue.create({
        data: {
            title,
            description,
            projectId,
            reporterId: session.user.id,
            priority: priority || "MEDIUM",
            type: type || "TASK",
            status: status || "TODO",
            order: newOrder,
            columnId: targetColumnId,
            dueDate: dueDate ? new Date(dueDate) : null,
            attachmentUrl,
            attachmentName,
        },
    });

    return { success: "Issue created!", issue };
};

export const updateIssueStatus = async (issueId: string, status: "TODO" | "IN_PROGRESS" | "DONE") => {
    const session = await auth();

    if (!session?.user?.id) {
        return { error: "Unauthorized" };
    }

    await db.issue.update({
        where: { id: issueId },
        data: { status },
    });

    return { success: "Status updated!" };
};

export const updateIssueOrder = async (items: { id: string; order: number; columnId: string }[]) => {
    const session = await auth();

    if (!session?.user?.id) {
        return { error: "Unauthorized" };
    }

    try {
        await db.$transaction(
            items.map((item) =>
                db.issue.update({
                    where: { id: item.id },
                    data: {
                        order: item.order,
                        columnId: item.columnId,
                    },
                })
            )
        );

        return { success: "Order updated!" };
    } catch (error) {
        return { error: "Failed to update order" };
    }
};

export const deleteIssue = async (issueId: string) => {
    const session = await auth();

    if (!session?.user?.id) {
        return { error: "Unauthorized" };
    }

    const issue = await db.issue.findUnique({
        where: { id: issueId }
    });

    if (!issue) {
        return { error: "Issue not found" };
    }

    if (issue.attachmentUrl) {
        await deleteAttachmentFromS3(issue.attachmentUrl);
    }

    await db.issue.delete({
        where: { id: issueId },
    });

    return { success: "Issue deleted!" };
};

export const updateIssue = async (values: z.infer<typeof IssueUpdateSchema>) => {
    const session = await auth();

    if (!session?.user?.id) {
        return { error: "Unauthorized" };
    }

    const validatedFields = IssueUpdateSchema.safeParse(values);

    if (!validatedFields.success) {
        return { error: "Invalid fields!" };
    }

    const { id, title, description, priority, type, status, dueDate, attachmentUrl, attachmentName } = validatedFields.data;

    const existingIssue = await db.issue.findUnique({
        where: { id }
    });

    if (!existingIssue) {
        return { error: "Issue not found!" };
    }

    // Clean up old attachment if it was changed or removed
    if (existingIssue.attachmentUrl && attachmentUrl !== undefined && existingIssue.attachmentUrl !== attachmentUrl) {
        await deleteAttachmentFromS3(existingIssue.attachmentUrl);
    }

    const issue = await db.issue.update({
        where: { id },
        data: {
            title,
            description,
            priority,
            type,
            status,
            dueDate: dueDate ? new Date(dueDate) : null,
            attachmentUrl: attachmentUrl !== undefined ? attachmentUrl : existingIssue.attachmentUrl,
            attachmentName: attachmentName !== undefined ? attachmentName : existingIssue.attachmentName,
        },
    });

    return { success: "Issue updated!", issue };
};

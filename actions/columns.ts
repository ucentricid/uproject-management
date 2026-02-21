"use server";

import { db } from "@/lib/db";
import { auth } from "@/auth";

export const createColumn = async (projectId: string, name: string) => {
    const session = await auth();
    console.log("createColumn called by:", session?.user?.id, "for project:", projectId);

    if (!session?.user?.id) {
        return { error: "Unauthorized" };
    }

    // Get the highest order in this project
    const lastColumn = await db.boardColumn.findFirst({
        where: { projectId },
        orderBy: { order: "desc" },
    });

    const newOrder = lastColumn ? lastColumn.order + 1 : 0;

    const column = await db.boardColumn.create({
        data: {
            name,
            order: newOrder,
            projectId,
        },
    });

    return { success: "Column created!", column };
};

export const deleteColumn = async (columnId: string) => {
    const session = await auth();

    if (!session?.user?.id) {
        return { error: "Unauthorized" };
    }

    // Check if the column has any issues
    const issueCount = await db.issue.count({
        where: { columnId },
    });

    if (issueCount > 0) {
        return { error: "Cannot delete a column that contains issues. Move all issues first." };
    }

    await db.boardColumn.delete({
        where: { id: columnId },
    });

    return { success: "Column deleted!" };
};

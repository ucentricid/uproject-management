import * as z from "zod";

export const LoginSchema = z.object({
    email: z.string().email({
        message: "Email is required",
    }),
    password: z.string().min(1, {
        message: "Password is required",
    }),
});


export const RegisterSchema = z.object({
    email: z.string().email({
        message: "Email is required",
    }),
    password: z.string().min(6, {
        message: "Minimum 6 characters required",
    }),
    name: z.string().min(1, {
        message: "Name is required",
    }),
});

export const UserUpdateSchema = z.object({
    name: z.string().min(1, {
        message: "Name is required",
    }),
    email: z.string().email({
        message: "Email is required",
    }).optional(),
    role: z.enum(["ADMIN", "MEMBER"]),
    password: z.string().optional(),
});

export const ProjectSchema = z.object({
    name: z.string().min(1, {
        message: "Project name is required",
    }),
    key: z.string().optional(),
    description: z.string().optional(),
});

export const IssueSchema = z.object({
    title: z.string().min(1, {
        message: "Title is required",
    }),
    description: z.string().optional(),
    projectId: z.string().min(1, {
        message: "Project ID is required",
    }),
    assigneeId: z.string().optional(),
    sprintId: z.string().optional(),
    priority: z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]).optional(),
    type: z.enum(["TASK", "BUG", "STORY", "EPIC"]).optional(),
    status: z.enum(["TODO", "IN_PROGRESS", "DONE"]).optional(),
    dueDate: z.string().min(1, {
        message: "Due date is required",
    }),
    attachmentUrl: z.string().optional(),
    attachmentName: z.string().optional(),
});

export const IssueUpdateSchema = z.object({
    id: z.string().min(1, {
        message: "Issue ID is required",
    }),
    title: z.string().min(1, {
        message: "Title is required",
    }),
    description: z.string().optional(),
    projectId: z.string().min(1, {
        message: "Project ID is required",
    }),
    assigneeId: z.string().optional(),
    sprintId: z.string().optional(),
    priority: z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]).optional(),
    type: z.enum(["TASK", "BUG", "STORY", "EPIC"]).optional(),
    status: z.enum(["TODO", "IN_PROGRESS", "DONE"]).optional(),
    dueDate: z.string().min(1, {
        message: "Due date is required",
    }),
    attachmentUrl: z.string().optional(),
    attachmentName: z.string().optional(),
});

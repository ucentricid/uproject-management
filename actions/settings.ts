"use server";

import * as z from "zod";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { auth } from "@/auth";

export const updatePassword = async (password: string) => {
    const session = await auth();

    if (!session?.user?.id) {
        return { error: "Unauthorized" };
    }

    if (!password || password.length < 6) {
        return { error: "Password must be at least 6 characters" };
    }

    try {
        const hashedPassword = await bcrypt.hash(password, 10);

        await db.user.update({
            where: { id: session.user.id },
            data: { password: hashedPassword }
        });

        return { success: "Password successfully updated!" };
    } catch (e) {
        console.error("Failed to update password:", e);
        return { error: "Failed to update password. Please try again." };
    }
};

export const updateUserName = async (name: string) => {
    const session = await auth();

    if (!session?.user?.id) {
        return { error: "Unauthorized" };
    }

    if (!name || name.trim().length === 0) {
        return { error: "Name is required" };
    }

    try {
        await db.user.update({
            where: { id: session.user.id },
            data: { name }
        });

        return { success: "Name successfully updated!" };
    } catch (e) {
        console.error("Failed to update name:", e);
        return { error: "Failed to update name. Please try again." };
    }
};

export const getSiteTitle = async () => {
    try {
        const setting = await db.systemSetting.findUnique({
            where: { key: "siteTitle" }
        });
        return setting?.value || "Project Management System";
    } catch {
        return "Project Management System";
    }
};

export const updateSiteTitle = async (title: string) => {
    const session = await auth();

    if (!session?.user?.id) {
        return { error: "Unauthorized" };
    }

    if (session.user.role !== "ADMIN") {
        return { error: "Only Administrators can change the site title" };
    }

    if (!title || title.trim().length === 0) {
        return { error: "Title is required" };
    }

    try {
        await db.systemSetting.upsert({
            where: { key: "siteTitle" },
            update: { value: title },
            create: { key: "siteTitle", value: title },
        });

        return { success: "Site title successfully updated!" };
    } catch (e) {
        console.error("Failed to update site title:", e);
        return { error: "Failed to update site title. Please try again." };
    }
};

export const getDashboardSettings = async () => {
    try {
        const [nameSetting, logoSetting] = await Promise.all([
            db.systemSetting.findUnique({ where: { key: "dashboardName" } }),
            db.systemSetting.findUnique({ where: { key: "dashboardLogo" } })
        ]);

        return {
            dashboardName: nameSetting?.value || "ProjectManager",
            dashboardLogo: logoSetting?.value || "P",
        };
    } catch {
        return {
            dashboardName: "ProjectManager",
            dashboardLogo: "P",
        };
    }
};

export const updateDashboardSettings = async (name: string, logo: string) => {
    const session = await auth();

    if (!session?.user?.id) {
        return { error: "Unauthorized" };
    }

    if (session.user.role !== "ADMIN") {
        return { error: "Only Administrators can change system settings" };
    }

    if (!name || name.trim().length === 0) {
        return { error: "Dashboard name is required" };
    }

    if (!logo || logo.trim().length === 0) {
        return { error: "Dashboard logo is required" };
    }

    try {
        await db.$transaction([
            db.systemSetting.upsert({
                where: { key: "dashboardName" },
                update: { value: name },
                create: { key: "dashboardName", value: name },
            }),
            db.systemSetting.upsert({
                where: { key: "dashboardLogo" },
                update: { value: logo },
                create: { key: "dashboardLogo", value: logo },
            })
        ]);

        return { success: "Dashboard settings successfully updated!" };
    } catch (e) {
        console.error("Failed to update dashboard settings:", e);
        return { error: "Failed to update dashboard settings. Please try again." };
    }
};

"use server";

import { S3Client, PutObjectCommand, DeleteObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { auth } from "@/auth";

const s3Client = new S3Client({
    region: "auto",
    endpoint: process.env.MINIO_ENDPOINT,
    credentials: {
        accessKeyId: process.env.MINIO_ACCESS_KEY!,
        secretAccessKey: process.env.MINIO_SECRET_KEY!,
    },
    forcePathStyle: true, // Required for Minio
});

import { db } from "@/lib/db";

export const getUploadUrl = async (fileName: string, contentType: string, projectId: string, issueTitle: string) => {
    const session = await auth();

    if (!session?.user?.id) {
        return { error: "Unauthorized" };
    }

    try {
        const bucket = "uprojects";

        // Fetch project to get its name
        const project = await db.project.findUnique({
            where: { id: projectId }
        });

        if (!project) {
            return { error: "Project not found" };
        }

        const projectName = project.name.replace(/[^a-zA-Z0-9.-]/g, "_");
        const safeTitle = issueTitle.replace(/[^a-zA-Z0-9.-]/g, "_");
        const userName = session.user.name?.replace(/[^a-zA-Z0-9.-]/g, "_") || "UnknownUser";

        const timestamp = Date.now();
        const safeFileName = fileName.replace(/[^a-zA-Z0-9.-]/g, "_");

        // dynamic path: issue_attachment_file/{project_name}/{issue_title}/{user_name}/timestamp_filename
        const key = `issue_attachment_file/${projectName}/${safeTitle}/${userName}/${timestamp}_${safeFileName}`;

        const command = new PutObjectCommand({
            Bucket: bucket,
            Key: key,
            ContentType: contentType,
        });

        // 5 minutes expiration
        const signedUrl = await getSignedUrl(s3Client, command, { expiresIn: 300 });

        // Minio sometimes returns the internal container IP instead of the public endpoint depending on how it's configured.
        // We ensure we replace it with our public endpoint for safety.
        let safeUrl = signedUrl;
        if (process.env.MINIO_ENDPOINT) {
            const endpointUrl = new URL(process.env.MINIO_ENDPOINT);
            const generatedUrl = new URL(signedUrl);
            generatedUrl.host = endpointUrl.host;
            generatedUrl.protocol = endpointUrl.protocol;
            generatedUrl.port = endpointUrl.port;
            safeUrl = generatedUrl.toString();
        }

        return {
            success: true,
            uploadUrl: safeUrl,
            fileUrl: `${process.env.MINIO_ENDPOINT}/${bucket}/${key}`,
            key
        };
    } catch (error) {
        console.error("Error generating presigned URL:", error);
        return { error: "Failed to generate upload URL" };
    }
};

export const deleteAttachmentFromS3 = async (fileUrl: string) => {
    try {
        const bucket = "uprojects";
        const prefix = `${process.env.MINIO_ENDPOINT}/${bucket}/`;

        if (!fileUrl.startsWith(prefix)) {
            return { error: "Invalid URL or not from our bucket" };
        }

        const key = fileUrl.replace(prefix, "");

        const command = new DeleteObjectCommand({
            Bucket: bucket,
            Key: key,
        });

        await s3Client.send(command);
        return { success: true };
    } catch (error) {
        console.error("Error deleting file from S3:", error);
        return { error: "Failed to delete file from storage" };
    }
};

export const getDownloadUrl = async (fileUrl: string, fileName: string) => {
    const session = await auth();

    if (!session?.user?.id) {
        return { error: "Unauthorized" };
    }

    try {
        const bucket = "uprojects";
        const prefix = `${process.env.MINIO_ENDPOINT}/${bucket}/`;

        if (!fileUrl.startsWith(prefix)) {
            return { error: "Invalid URL or not from our bucket" };
        }

        const key = fileUrl.replace(prefix, "");

        const command = new GetObjectCommand({
            Bucket: bucket,
            Key: key,
            ResponseContentDisposition: `attachment; filename="${fileName}"`,
        });

        const signedUrl = await getSignedUrl(s3Client, command, { expiresIn: 300 });

        let safeUrl = signedUrl;
        if (process.env.MINIO_ENDPOINT) {
            const endpointUrl = new URL(process.env.MINIO_ENDPOINT);
            const generatedUrl = new URL(signedUrl);
            generatedUrl.host = endpointUrl.host;
            generatedUrl.protocol = endpointUrl.protocol;
            generatedUrl.port = endpointUrl.port;
            safeUrl = generatedUrl.toString();
        }

        return { success: true, downloadUrl: safeUrl };
    } catch (error) {
        console.error("Error generating download URL:", error);
        return { error: "Failed to generate download URL" };
    }
};

export const getDiscussionUploadUrl = async (fileName: string, contentType: string, projectId: string) => {
    const session = await auth();

    if (!session?.user?.id) {
        return { error: "Unauthorized" };
    }

    try {
        const bucket = "uprojects";

        const project = await db.project.findUnique({
            where: { id: projectId }
        });

        if (!project) {
            return { error: "Project not found" };
        }

        const projectName = project.name.replace(/[^a-zA-Z0-9.-]/g, "_");
        const userName = session.user.name?.replace(/[^a-zA-Z0-9.-]/g, "_") || "UnknownUser";

        const timestamp = Date.now();
        const safeFileName = fileName.replace(/[^a-zA-Z0-9.-]/g, "_");

        // dynamic path: discussion_attachment_file/{project_name}/discussion/{user_name}/timestamp_filename
        const key = `discussion_attachment_file/${projectName}/discussion/${userName}/${timestamp}_${safeFileName}`;

        const command = new PutObjectCommand({
            Bucket: bucket,
            Key: key,
            ContentType: contentType,
        });

        const signedUrl = await getSignedUrl(s3Client, command, { expiresIn: 300 });

        let safeUrl = signedUrl;
        if (process.env.MINIO_ENDPOINT) {
            const endpointUrl = new URL(process.env.MINIO_ENDPOINT);
            const generatedUrl = new URL(signedUrl);
            generatedUrl.host = endpointUrl.host;
            generatedUrl.protocol = endpointUrl.protocol;
            generatedUrl.port = endpointUrl.port;
            safeUrl = generatedUrl.toString();
        }

        return {
            success: true,
            uploadUrl: safeUrl,
            fileUrl: `${process.env.MINIO_ENDPOINT}/${bucket}/${key}`,
            key
        };
    } catch (error) {
        console.error("Error generating presigned URL for discussion:", error);
        return { error: "Failed to generate discussion upload URL" };
    }
};

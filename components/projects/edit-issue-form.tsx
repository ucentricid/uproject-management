"use client";

import dynamic from "next/dynamic";
import "react-quill-new/dist/quill.snow.css";

const ReactQuill = dynamic(() => import("react-quill-new"), { ssr: false });
import * as z from "zod";
import { useState, useTransition, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { IssueUpdateSchema } from "@/schemas";
import { Input } from "@/components/ui/input";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { FormError } from "@/components/form-error";
import { FormSuccess } from "@/components/form-success";
import { updateIssue } from "@/actions/issues";
import { getUploadUrl } from "@/actions/upload";
import { Paperclip, X } from "lucide-react";

import { Issue } from "@prisma/client";
import { format } from "date-fns";

interface EditIssueFormProps {
    issue: Issue & { attachmentUrl?: string | null, attachmentName?: string | null };
    onSuccess?: (issue: Issue) => void;
    onCancel?: () => void;
}

export const EditIssueForm = ({ issue, onSuccess, onCancel }: EditIssueFormProps) => {
    const [error, setError] = useState<string | undefined>("");
    const [success, setSuccess] = useState<string | undefined>("");
    const [isPending, startTransition] = useTransition();

    const [attachment, setAttachment] = useState<File | null>(null);
    const [existingAttachment, setExistingAttachment] = useState<{ url: string, name: string } | null>(
        issue.attachmentUrl && issue.attachmentName
            ? { url: issue.attachmentUrl, name: issue.attachmentName }
            : null
    );
    const [removeExisting, setRemoveExisting] = useState(false);

    const fileInputRef = useRef<HTMLInputElement>(null);

    const form = useForm<z.infer<typeof IssueUpdateSchema>>({
        resolver: zodResolver(IssueUpdateSchema),
        defaultValues: {
            id: issue.id,
            title: issue.title,
            description: issue.description || "",
            projectId: issue.projectId,
            priority: issue.priority || "MEDIUM",
            type: issue.type || "TASK",
            status: issue.status || "TODO",
            dueDate: issue.dueDate ? format(new Date(issue.dueDate), "yyyy-MM-dd") : "",
            attachmentUrl: issue.attachmentUrl || "",
            attachmentName: issue.attachmentName || "",
        },
    });

    const onSubmit = async (values: z.infer<typeof IssueUpdateSchema>) => {
        setError("");
        setSuccess("");

        startTransition(async () => {
            let finalValues = { ...values };

            // Handle new file upload
            if (attachment) {
                const { uploadUrl, fileUrl, error: uploadError } = await getUploadUrl(
                    attachment.name,
                    attachment.type,
                    values.projectId,
                    values.title
                );

                if (uploadError || !uploadUrl) {
                    setError(uploadError || "Failed to initiate file upload");
                    return;
                }

                try {
                    const uploadResponse = await fetch(uploadUrl, {
                        method: "PUT",
                        body: attachment,
                        headers: {
                            "Content-Type": attachment.type,
                        },
                    });

                    if (!uploadResponse.ok) {
                        throw new Error("Failed to upload file to storage");
                    }

                    finalValues.attachmentUrl = fileUrl;
                    finalValues.attachmentName = attachment.name;
                } catch (err: any) {
                    setError("Failed to upload attachment: " + err.message);
                    return;
                }
            } else if (removeExisting) {
                // Handle removing existing file
                finalValues.attachmentUrl = "";
                finalValues.attachmentName = "";
            } else if (existingAttachment) {
                // Keep existing file
                finalValues.attachmentUrl = existingAttachment.url;
                finalValues.attachmentName = existingAttachment.name;
            }

            const data = await updateIssue(finalValues);

            if (data?.error) {
                setError(data.error);
            }
            if (data?.success) {
                setSuccess(data.success);
                if (onSuccess && data.issue) {
                    onSuccess(data.issue);
                }
            }
        });
    };

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <div className="space-y-4">
                    <FormField
                        control={form.control}
                        name="title"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Title</FormLabel>
                                <FormControl>
                                    <Input
                                        {...field}
                                        disabled={isPending}
                                        placeholder="Issue title"
                                    />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="description"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Description</FormLabel>
                                <FormControl>
                                    <div className="bg-background rounded-md" id="edit-issue-quill">
                                        <ReactQuill
                                            theme="snow"
                                            value={field.value || ""}
                                            onChange={field.onChange}
                                            placeholder="Issue description..."
                                            className="h-[150px] mb-12"
                                        />
                                    </div>
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <div className="grid grid-cols-2 gap-4">
                        <FormField
                            control={form.control}
                            name="priority"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Priority</FormLabel>
                                    <Select
                                        disabled={isPending}
                                        onValueChange={field.onChange}
                                        defaultValue={field.value}
                                    >
                                        <FormControl>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select priority" />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            <SelectItem value="LOW">Low</SelectItem>
                                            <SelectItem value="MEDIUM">Medium</SelectItem>
                                            <SelectItem value="HIGH">High</SelectItem>
                                            <SelectItem value="URGENT">Urgent</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="type"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Type</FormLabel>
                                    <Select
                                        disabled={isPending}
                                        onValueChange={field.onChange}
                                        defaultValue={field.value}
                                    >
                                        <FormControl>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select type" />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            <SelectItem value="TASK">Task</SelectItem>
                                            <SelectItem value="BUG">Bug</SelectItem>
                                            <SelectItem value="STORY">Story</SelectItem>
                                            <SelectItem value="EPIC">Epic</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    </div>
                    <FormField
                        control={form.control}
                        name="dueDate"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Due Date</FormLabel>
                                <FormControl>
                                    <Input
                                        {...field}
                                        disabled={isPending}
                                        type="date"
                                    />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <div className="space-y-2">
                        <FormLabel>Attachment</FormLabel>
                        <div className="flex items-center gap-2">
                            <input
                                type="file"
                                className="hidden"
                                ref={fileInputRef}
                                onChange={(e) => {
                                    if (e.target.files && e.target.files[0]) {
                                        setAttachment(e.target.files[0]);
                                        setRemoveExisting(true); // Replacing existing file
                                    }
                                }}
                                disabled={isPending}
                            />

                            {!attachment && !existingAttachment ? (
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => fileInputRef.current?.click()}
                                    disabled={isPending}
                                    className="w-full justify-start text-muted-foreground font-normal"
                                >
                                    <Paperclip className="mr-2 h-4 w-4" />
                                    Attach a file to this issue
                                </Button>
                            ) : (
                                <div className="flex items-center justify-between w-full p-2 border rounded-md bg-muted/50">
                                    <div className="flex items-center gap-2 overflow-hidden">
                                        <Paperclip className="h-4 w-4 text-muted-foreground shrink-0" />
                                        <span className="text-sm truncate max-w-[200px]">
                                            {attachment ? attachment.name : existingAttachment?.name}
                                        </span>
                                        {attachment && (
                                            <span className="text-xs text-muted-foreground shrink-0">
                                                ({(attachment.size / 1024 / 1024).toFixed(2)} MB)
                                            </span>
                                        )}
                                    </div>
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="sm"
                                        className="h-8 w-8 p-0 shrink-0 text-muted-foreground hover:text-destructive"
                                        onClick={() => {
                                            setAttachment(null);
                                            setExistingAttachment(null);
                                            setRemoveExisting(true);
                                            if (fileInputRef.current) fileInputRef.current.value = "";
                                        }}
                                        disabled={isPending}
                                    >
                                        <X className="h-4 w-4" />
                                    </Button>
                                </div>
                            )}
                        </div>
                    </div>

                </div>
                <FormError message={error} />
                <FormSuccess message={success} />
                <div className="flex justify-end gap-4">
                    <Button
                        disabled={isPending}
                        type="button"
                        variant="outline"
                        onClick={onCancel}
                    >
                        Cancel
                    </Button>
                    <Button
                        disabled={isPending}
                        type="submit"
                    >
                        {isPending ? "Updating..." : "Update Issue"}
                    </Button>
                </div>
            </form>
        </Form>
    );
};

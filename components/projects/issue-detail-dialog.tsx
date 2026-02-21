"use client";

import { Issue, User } from "@prisma/client";
import { format } from "date-fns";
import { Calendar, User as UserIcon, Tag, AlertCircle, Trash2, Paperclip } from "lucide-react";
import { useState, useTransition } from "react";

import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { deleteIssue } from "@/actions/issues";
import { getDownloadUrl } from "@/actions/upload";
import { AlertConfirmation } from "@/components/ui/alert-confirmation";

import { EditIssueForm } from "@/components/projects/edit-issue-form";

interface IssueWithAssignee extends Issue {
    assignee: User | null;
}

interface IssueDetailDialogProps {
    issue: IssueWithAssignee | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onDelete?: (issueId: string) => void;
    onUpdate?: (issue: IssueWithAssignee) => void;
    isProjectOwner?: boolean;
}

export const IssueDetailDialog = ({ issue, open, onOpenChange, onDelete, onUpdate, isProjectOwner }: IssueDetailDialogProps) => {
    const [isPending, startTransition] = useTransition();
    const [showDeleteAlert, setShowDeleteAlert] = useState(false);
    const [isEditing, setIsEditing] = useState(false);

    // Reset editing state when dialog closes or issue changes
    if (!open && isEditing) {
        setIsEditing(false);
    }

    if (!issue) return null;

    const handleDeleteClick = () => {
        setShowDeleteAlert(true);
    };

    const handleDownload = async (e: React.MouseEvent, url: string, name: string) => {
        e.preventDefault();
        try {
            const result = await getDownloadUrl(url, name);
            if (result.success && result.downloadUrl) {
                // creating dynamic anchor element to enforce download, just in case
                const a = document.createElement("a");
                a.href = result.downloadUrl;
                a.download = name;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
            } else {
                alert(result.error || "Failed to prepare download");
            }
        } catch (error) {
            console.error("Error downloading attachment:", error);
            alert("An error occurred while downloading.");
        }
    };

    const confirmDelete = () => {
        startTransition(() => {
            deleteIssue(issue.id).then((result) => {
                if (result.success) {
                    onDelete?.(issue.id);
                    onOpenChange(false);
                }
                setShowDeleteAlert(false);
            });
        });
    };

    return (
        <Dialog open={open} onOpenChange={(newOpen) => {
            if (!newOpen) setIsEditing(false);
            onOpenChange(newOpen);
        }}>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                {isEditing ? (
                    <div className="p-2">
                        <DialogHeader className="mb-6">
                            <DialogTitle className="text-2xl">Edit Issue</DialogTitle>
                        </DialogHeader>
                        <EditIssueForm
                            issue={issue}
                            onCancel={() => setIsEditing(false)}
                            onSuccess={(updatedIssue) => {
                                setIsEditing(false);
                                onUpdate?.(updatedIssue as IssueWithAssignee);
                            }}
                        />
                    </div>
                ) : (
                    <>
                        <DialogHeader>
                            <div className="flex items-center gap-2 mb-2">
                                <span className="text-sm text-muted-foreground uppercase tracking-wider">
                                    {issue.projectId ? "ISSUE" : "TASK"}
                                </span>
                                <Badge variant="outline">{issue.type}</Badge>
                            </div>
                            <DialogTitle className="text-2xl">{issue.title}</DialogTitle>
                        </DialogHeader>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-4">
                            <div className="md:col-span-2 space-y-4">
                                <div>
                                    <h3 className="text-sm font-medium mb-2">Description</h3>
                                    <div className="text-sm text-muted-foreground p-4 bg-muted/30 rounded-md">
                                        {issue.description ? (
                                            <div
                                                className="prose prose-sm dark:prose-invert max-w-none"
                                                dangerouslySetInnerHTML={{ __html: issue.description }}
                                            />
                                        ) : (
                                            "No description provided."
                                        )}
                                    </div>

                                    {issue.attachmentUrl && issue.attachmentName && (
                                        <div className="mt-6">
                                            <h3 className="text-sm font-medium mb-2">Attachment</h3>
                                            <button
                                                onClick={(e) => handleDownload(e, issue.attachmentUrl!, issue.attachmentName!)}
                                                className="inline-flex items-center gap-2 p-3 border rounded-md hover:bg-muted/50 transition-colors bg-muted/20 w-full text-left"
                                            >
                                                <Paperclip className="h-4 w-4 text-blue-500 shrink-0" />
                                                <span className="text-sm text-blue-500 hover:underline truncate">{issue.attachmentName}</span>
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="space-y-6">
                                <div>
                                    <h3 className="text-sm font-medium mb-2 text-muted-foreground">Status</h3>
                                    <Badge variant={
                                        issue.status === "DONE" ? "default" :
                                            issue.status === "IN_PROGRESS" ? "secondary" : "outline"
                                    }>
                                        {issue.status.replace("_", " ")}
                                    </Badge>
                                </div>

                                <div>
                                    <h3 className="text-sm font-medium mb-2 text-muted-foreground">Priority</h3>
                                    <div className="flex items-center gap-2">
                                        <AlertCircle className={`h-4 w-4 ${issue.priority === "URGENT" ? "text-destructive" : "text-muted-foreground"
                                            }`} />
                                        <span className="text-sm">{issue.priority}</span>
                                    </div>
                                </div>


                                <Separator />

                                <div className="space-y-2">
                                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                        <Calendar className="h-3 w-3" />
                                        Created {format(new Date(issue.createdAt), "MMM d, yyyy")}
                                    </div>

                                </div>

                                {isProjectOwner && (
                                    <>
                                        <Separator />
                                        <div className="space-y-2">
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                className="w-full"
                                                onClick={() => setIsEditing(true)}
                                            >
                                                Edit Issue
                                            </Button>
                                            <Button
                                                variant="destructive"
                                                size="sm"
                                                className="w-full"
                                                onClick={handleDeleteClick}
                                                disabled={isPending}
                                            >
                                                <Trash2 className="mr-2 h-4 w-4" />
                                                {isPending ? "Deleting..." : "Delete Issue"}
                                            </Button>
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>
                    </>
                )}
            </DialogContent>

            <AlertConfirmation
                open={showDeleteAlert}
                onOpenChange={setShowDeleteAlert}
                title="Delete Issue"
                description="Are you sure you want to delete this issue? This action cannot be undone."
                onConfirm={confirmDelete}
                isPending={isPending}
            />
        </Dialog>
    );
};

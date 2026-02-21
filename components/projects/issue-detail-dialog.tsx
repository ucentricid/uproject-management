"use client";

import { Issue, User } from "@prisma/client";
import { format } from "date-fns";
import { Calendar, User as UserIcon, Tag, AlertCircle, Trash2 } from "lucide-react";
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
import { AlertConfirmation } from "@/components/ui/alert-confirmation";

interface IssueWithAssignee extends Issue {
    assignee: User | null;
}

interface IssueDetailDialogProps {
    issue: IssueWithAssignee | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onDelete?: (issueId: string) => void;
    isProjectOwner?: boolean;
}

export const IssueDetailDialog = ({ issue, open, onOpenChange, onDelete, isProjectOwner }: IssueDetailDialogProps) => {
    const [isPending, startTransition] = useTransition();
    const [showDeleteAlert, setShowDeleteAlert] = useState(false);

    if (!issue) return null;

    const handleDeleteClick = () => {
        setShowDeleteAlert(true);
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
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl">
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
                            </>
                        )}
                    </div>
                </div>
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

"use client";

import { Issue, User, BoardColumn } from "@prisma/client";
import { Plus, Trash2, Calendar } from "lucide-react";
import { useState, useTransition } from "react";
import { DragDropContext, Droppable, Draggable, DropResult } from "@hello-pangea/dnd";
import { AlertConfirmation } from "@/components/ui/alert-confirmation";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { CreateIssueForm } from "@/components/projects/create-issue-form";
import { updateIssueOrder } from "@/actions/issues";
import { createColumn, deleteColumn } from "@/actions/columns";
import { IssueDetailDialog } from "@/components/projects/issue-detail-dialog";
import { Badge } from "@/components/ui/badge";

interface IssueWithAssignee extends Issue {
    assignee: User | null;
}

interface ColumnWithIssues extends BoardColumn {
    issues: IssueWithAssignee[];
}

interface IssueBoardProps {
    projectId: string;
    columns: ColumnWithIssues[];
    isProjectOwner?: boolean;
    onIssueCreate?: (issue: IssueWithAssignee & { columnName: string }) => void;
    onIssueMove?: (issueId: string, newColumnName: string) => void;
    onIssueUpdate?: (issueId: string, updatedIssue: Partial<IssueWithAssignee>) => void;
}

export const IssueBoard = ({ projectId, columns: initialColumns, isProjectOwner, onIssueCreate, onIssueMove, onIssueUpdate }: IssueBoardProps) => {
    const [columns, setColumns] = useState<ColumnWithIssues[]>(
        initialColumns.map(col => ({
            ...col,
            issues: [...col.issues].sort((a, b) => a.order - b.order),
        }))
    );
    const [open, setOpen] = useState(false);
    const [selectedIssue, setSelectedIssue] = useState<IssueWithAssignee | null>(null);
    const [detailOpen, setDetailOpen] = useState(false);
    const [isPending, startTransition] = useTransition();
    const [newColumnName, setNewColumnName] = useState("");

    const [columnDialogOpen, setColumnDialogOpen] = useState(false);
    const [columnToDelete, setColumnToDelete] = useState<string | null>(null);

    const onDragEnd = (result: DropResult) => {
        const { destination, source, draggableId } = result;

        if (!destination) return;

        if (
            destination.droppableId === source.droppableId &&
            destination.index === source.index
        ) {
            return;
        }

        const newColumns = columns.map(col => ({
            ...col,
            issues: [...col.issues],
        }));

        const sourceCol = newColumns.find(c => c.id === source.droppableId);
        const destCol = newColumns.find(c => c.id === destination.droppableId);

        if (!sourceCol || !destCol) return;

        // Remove from source
        const [movedIssue] = sourceCol.issues.splice(source.index, 1);

        // Add to destination
        movedIssue.columnId = destCol.id;
        destCol.issues.splice(destination.index, 0, movedIssue);

        // Re-assign order for affected columns
        sourceCol.issues.forEach((issue, index) => {
            issue.order = index;
        });
        destCol.issues.forEach((issue, index) => {
            issue.order = index;
        });

        setColumns(newColumns);

        // Notify parent if issue changed column (for timeline sync)
        if (source.droppableId !== destination.droppableId) {
            onIssueMove?.(draggableId, destCol.name);
        }

        // Prepare bulk update payload (only affected columns)
        const affectedIssues = [
            ...sourceCol.issues.map(i => ({ id: i.id, order: i.order, columnId: sourceCol.id })),
            ...(source.droppableId !== destination.droppableId
                ? destCol.issues.map(i => ({ id: i.id, order: i.order, columnId: destCol.id }))
                : []),
        ];

        startTransition(() => {
            updateIssueOrder(affectedIssues);
        });
    };

    const handleAddColumn = () => {
        if (!newColumnName.trim()) return;

        startTransition(() => {
            createColumn(projectId, newColumnName.trim()).then((result) => {
                if (result.error) {
                    alert("Error creating column: " + result.error);
                }
                if (result.column) {
                    setColumns(prev => [...prev, { ...result.column!, issues: [] }]);
                    setNewColumnName("");
                    setColumnDialogOpen(false);
                }
            });
        });
    };

    const handleDeleteColumn = (columnId: string) => {
        setColumnToDelete(columnId);
    };

    const confirmDeleteColumn = () => {
        if (!columnToDelete) return;

        startTransition(() => {
            deleteColumn(columnToDelete).then((result) => {
                if (result.error) {
                    alert(result.error);
                } else {
                    setColumns(prev => prev.filter(c => c.id !== columnToDelete));
                }
                setColumnToDelete(null);
            });
        });
    };

    return (
        <div className="flex flex-col h-full">
            <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-bold tracking-tight">Board</h2>
                <div className="flex gap-2">
                    {isProjectOwner && (
                        <>
                            <Dialog open={open} onOpenChange={setOpen}>
                                <DialogTrigger asChild>
                                    <Button size="sm">
                                        <Plus className="mr-2 h-4 w-4" />
                                        Create Issue
                                    </Button>
                                </DialogTrigger>
                                <DialogContent>
                                    <DialogHeader>
                                        <DialogTitle>Create New Issue</DialogTitle>
                                    </DialogHeader>
                                    <CreateIssueForm
                                        projectId={projectId}
                                        onSuccess={(issue) => {
                                            // Find target column first before state updates to avoid side effects inside setState
                                            const targetCol = columns.find(col => col.id === issue.columnId || (!issue.columnId && col.order === 0));

                                            if (targetCol) {
                                                onIssueCreate?.({ ...issue, assignee: null, columnName: targetCol.name });
                                            }

                                            // Add issue to the matching column (or first column)
                                            setColumns(prev => prev.map(col => {
                                                const isTarget = col.id === issue.columnId || (!issue.columnId && col.order === 0);
                                                if (isTarget) {
                                                    return {
                                                        ...col,
                                                        issues: [...col.issues, { ...issue, assignee: null }],
                                                    };
                                                }
                                                return col;
                                            }));
                                            setOpen(false);
                                        }}
                                    />
                                </DialogContent>
                            </Dialog>
                            <Dialog open={columnDialogOpen} onOpenChange={setColumnDialogOpen}>
                                <DialogTrigger asChild>
                                    <Button size="sm" variant="outline">
                                        <Plus className="mr-2 h-4 w-4" />
                                        Add Column
                                    </Button>
                                </DialogTrigger>
                                <DialogContent>
                                    <DialogHeader>
                                        <DialogTitle>Add New Column</DialogTitle>
                                    </DialogHeader>
                                    <div className="space-y-4">
                                        <Input
                                            placeholder="Column name..."
                                            value={newColumnName}
                                            onChange={(e) => setNewColumnName(e.target.value)}
                                            onKeyDown={(e) => {
                                                if (e.key === "Enter") {
                                                    handleAddColumn();
                                                }
                                            }}
                                            disabled={isPending}
                                        />
                                        <Button
                                            onClick={handleAddColumn}
                                            disabled={isPending || !newColumnName.trim()}
                                            className="w-full"
                                        >
                                            Add Column
                                        </Button>
                                    </div>
                                </DialogContent>
                            </Dialog>
                        </>
                    )}
                </div>
            </div>

            <IssueDetailDialog
                issue={selectedIssue}
                open={detailOpen}
                onOpenChange={setDetailOpen}
                isProjectOwner={isProjectOwner}
                onUpdate={(updatedIssue) => {
                    setColumns(prev => prev.map(col => ({
                        ...col,
                        issues: col.issues.map(i => i.id === updatedIssue.id ? { ...i, ...updatedIssue } : i),
                    })));
                    setSelectedIssue(updatedIssue);
                    onIssueUpdate?.(updatedIssue.id, updatedIssue);
                }}
                onDelete={(issueId) => {
                    setColumns(prev => prev.map(col => ({
                        ...col,
                        issues: col.issues.filter(i => i.id !== issueId),
                    })));
                    setSelectedIssue(null);
                }}
            />

            <DragDropContext onDragEnd={onDragEnd}>
                <div className="flex-1 overflow-x-auto overflow-y-auto pb-4">
                    <div className="flex gap-6 min-h-full pb-4" style={{ minWidth: "max-content" }}>
                        {columns.map((column) => (
                            <div key={column.id} className="flex flex-col gap-4 rounded-lg bg-muted/50 p-4 h-fit w-[280px] flex-shrink-0">
                                <div className="flex items-center justify-between px-2">
                                    <h3 className="font-semibold text-sm uppercase tracking-wider text-muted-foreground">
                                        {column.name}
                                        <span className="ml-2 text-xs">({column.issues.length})</span>
                                    </h3>
                                    {isProjectOwner && column.issues.length === 0 && (
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive"
                                            onClick={() => handleDeleteColumn(column.id)}
                                            disabled={isPending}
                                        >
                                            <Trash2 className="h-3.5 w-3.5" />
                                        </Button>
                                    )}
                                </div>
                                <Droppable droppableId={column.id}>
                                    {(provided) => (
                                        <div
                                            {...provided.droppableProps}
                                            ref={provided.innerRef}
                                            className="flex flex-col gap-2 flex-1 min-h-[100px]"
                                        >
                                            {column.issues.map((issue, index) => (
                                                <Draggable key={issue.id} draggableId={issue.id} index={index}>
                                                    {(provided) => (
                                                        <Card
                                                            ref={provided.innerRef}
                                                            {...provided.draggableProps}
                                                            {...provided.dragHandleProps}
                                                            onClick={() => {
                                                                setSelectedIssue(issue);
                                                                setDetailOpen(true);
                                                            }}
                                                            className="cursor-pointer hover:shadow-md transition-shadow p-3 space-y-2"
                                                        >
                                                            <div className="flex justify-between items-start gap-2">
                                                                <span className="text-sm font-medium leading-tight line-clamp-2">
                                                                    {issue.title}
                                                                </span>
                                                            </div>

                                                            <div className="flex items-center justify-between gap-2">
                                                                <Badge variant={
                                                                    issue.priority === "URGENT" ? "destructive" :
                                                                        issue.priority === "HIGH" ? "default" :
                                                                            issue.priority === "MEDIUM" ? "secondary" : "outline"
                                                                } className="text-[10px] px-1.5 py-0 h-5 font-normal">
                                                                    {issue.priority}
                                                                </Badge>
                                                                <span className="text-[10px] text-muted-foreground uppercase tracking-wider">
                                                                    {issue.type}
                                                                </span>
                                                            </div>

                                                            {issue.dueDate && (() => {
                                                                const today = new Date();
                                                                today.setHours(0, 0, 0, 0);
                                                                const due = new Date(issue.dueDate);
                                                                due.setHours(0, 0, 0, 0);
                                                                const diffDays = Math.round((due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
                                                                const isOverdue = diffDays < 0;
                                                                const isToday = diffDays === 0;
                                                                return (
                                                                    <div className={`flex items-center gap-1 text-[10px] font-medium px-1.5 py-0.5 rounded w-fit ${isOverdue ? "bg-destructive/10 text-destructive" :
                                                                        isToday ? "bg-orange-100 text-orange-600 dark:bg-orange-950 dark:text-orange-400" :
                                                                            "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400"
                                                                        }`}>
                                                                        <Calendar className="h-2.5 w-2.5" />
                                                                        {isOverdue
                                                                            ? `${Math.abs(diffDays)}d overdue`
                                                                            : isToday
                                                                                ? "Due today"
                                                                                : `${diffDays}d left`
                                                                        }
                                                                    </div>
                                                                );
                                                            })()}
                                                        </Card>
                                                    )}
                                                </Draggable>
                                            ))}
                                            {provided.placeholder}
                                        </div>
                                    )}
                                </Droppable>
                            </div>
                        ))}


                    </div>
                </div>
            </DragDropContext>

            <AlertConfirmation
                open={!!columnToDelete}
                onOpenChange={(open) => !open && setColumnToDelete(null)}
                title="Delete Column"
                description="Are you sure you want to delete this column? This action cannot be undone."
                onConfirm={confirmDeleteColumn}
                isPending={isPending}
            />
        </div>
    );
};

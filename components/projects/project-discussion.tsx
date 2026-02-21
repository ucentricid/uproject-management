"use client";

import { useState, useTransition, useEffect, useRef } from "react";
import { MessageSquare, Send, Trash2, Reply, ChevronDown, ChevronRight, Paperclip, X } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { MentionsInput, Mention } from "react-mentions";
import { getDiscussions, createDiscussion, deleteDiscussion } from "@/actions/discussions";
import { getDiscussionUploadUrl, getDownloadUrl } from "@/actions/upload";
import { AlertConfirmation } from "@/components/ui/alert-confirmation";

type DiscussionUser = {
    id: string;
    name: string | null;
    email: string | null;
};

type DiscussionItem = {
    id: string;
    content: string;
    createdAt: Date;
    user: DiscussionUser;
    parentId: string | null;
    replies: DiscussionItem[];
    attachmentUrl?: string | null;
    attachmentName?: string | null;
};

interface ProjectDiscussionProps {
    projectId: string;
    currentUserId: string;
    isParticipant: boolean;
    projectMembers: { id: string; name: string }[];
}

const renderContentWithMentions = (text: string) => {
    const regex = /@\[([^\]]+)\]\(([^)]+)\)/g;
    const parts = [];
    let lastIndex = 0;
    let match;

    while ((match = regex.exec(text)) !== null) {
        if (match.index > lastIndex) {
            parts.push(text.substring(lastIndex, match.index));
        }
        parts.push(
            <span key={match.index} className="text-primary font-semibold bg-primary/10 px-1 rounded">
                @{match[1]}
            </span>
        );
        lastIndex = regex.lastIndex;
    }

    if (lastIndex < text.length) {
        parts.push(text.substring(lastIndex));
    }

    return <>{parts}</>;
};

const mentionsInputStyle = {
    control: {
        fontSize: "0.875rem",
        fontWeight: "normal",
        color: "hsl(var(--foreground))",
    },
    highlighter: {
        padding: "8px",
    },
    input: {
        padding: "8px",
        margin: 0,
        outline: "none",
        border: "none",
        width: "100%",
    },
    suggestions: {
        list: {
            backgroundColor: "hsl(var(--popover))",
            border: "1px solid hsl(var(--border))",
            fontSize: "0.875rem",
            borderRadius: "0.375rem",
            boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)",
            overflow: "hidden",
            marginTop: "4px",
            zIndex: 50,
        },
        item: {
            padding: "8px 12px",
            borderBottom: "1px solid hsl(var(--border))",
            color: "hsl(var(--popover-foreground))",
            "&focused": {
                backgroundColor: "hsl(var(--accent))",
                color: "hsl(var(--accent-foreground))",
            },
        },
    },
};

const renderSuggestion = (suggestion: any, search: string, highlightedDisplay: React.ReactNode) => (
    <div className="flex items-center gap-2">
        <div className="h-6 w-6 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
            <span className="text-xs font-medium text-primary">
                {suggestion.display.charAt(0).toUpperCase()}
            </span>
        </div>
        <span>{highlightedDisplay}</span>
    </div>
);

const DiscussionReply = ({
    item,
    onReply,
    onDelete,
    isPending,
    currentUserId,
    projectMembers,
    depth = 0,
}: {
    item: DiscussionItem;
    onReply: (parentId: string, content: string, attachmentFile?: File | null) => void;
    onDelete: (id: string) => void;
    isPending: boolean;
    currentUserId: string;
    projectMembers: { id: string; name: string }[];
    depth?: number;
}) => {
    const [showReplyInput, setShowReplyInput] = useState(false);
    const [replyContent, setReplyContent] = useState("");
    const [showReplies, setShowReplies] = useState(true);
    const [attachment, setAttachment] = useState<File | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const isOwner = item.user.id === currentUserId;

    const handleReply = () => {
        if (!replyContent.trim() && !attachment) return;
        onReply(item.id, replyContent, attachment);
        setReplyContent("");
        setAttachment(null);
        if (fileInputRef.current) fileInputRef.current.value = "";
        setShowReplyInput(false);
    };

    const handleDownload = async (e: React.MouseEvent, url: string, name: string) => {
        e.preventDefault();
        try {
            const result = await getDownloadUrl(url, name);
            if (result.success && result.downloadUrl) {
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

    return (
        <div className={depth > 0 ? "ml-8 border-l-2 border-muted pl-4" : ""}>
            <div className="py-4">
                <div className="flex items-start gap-3">
                    <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                        <span className="text-sm font-semibold">
                            {item.user.name?.charAt(0)?.toUpperCase() || "?"}
                        </span>
                    </div>
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                            <span className="text-sm font-semibold">{item.user.name || item.user.email}</span>
                            <span className="text-xs text-muted-foreground">
                                {formatDistanceToNow(new Date(item.createdAt), { addSuffix: true })}
                            </span>
                        </div>
                        <p className="text-sm mt-1.5 whitespace-pre-wrap leading-relaxed">{renderContentWithMentions(item.content)}</p>

                        {item.attachmentUrl && item.attachmentName && (
                            <div className="mt-3">
                                <button
                                    onClick={(e) => handleDownload(e, item.attachmentUrl!, item.attachmentName!)}
                                    className="inline-flex items-center gap-2 p-2 border rounded-md hover:bg-muted/50 transition-colors bg-muted/20 text-left max-w-sm"
                                >
                                    <Paperclip className="h-4 w-4 text-blue-500 shrink-0" />
                                    <span className="text-xs text-blue-500 hover:underline truncate">{item.attachmentName}</span>
                                </button>
                            </div>
                        )}

                        <div className="flex items-center gap-1 mt-3">
                            {depth < 2 && (
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-7 text-xs text-muted-foreground"
                                    onClick={() => setShowReplyInput(!showReplyInput)}
                                >
                                    <Reply className="h-3 w-3 mr-1" />
                                    Reply
                                </Button>
                            )}
                            {isOwner && (
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-7 text-xs text-muted-foreground hover:text-destructive"
                                    onClick={() => onDelete(item.id)}
                                    disabled={isPending}
                                >
                                    <Trash2 className="h-3 w-3 mr-1" />
                                    Delete
                                </Button>
                            )}
                        </div>

                        {showReplyInput && (
                            <div className="mt-3 flex gap-2">
                                <div className="flex-1">
                                    <MentionsInput
                                        value={replyContent || ""}
                                        onChange={(e, newValue) => setReplyContent(newValue)}
                                        style={mentionsInputStyle}
                                        placeholder="Write a reply... (use @ to mention)"
                                        className="w-full min-h-[60px] text-sm border border-input rounded-md bg-transparent focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2 focus-within:ring-offset-background"
                                        disabled={isPending}
                                        onKeyDown={(e: any) => {
                                            if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
                                                handleReply();
                                            }
                                        }}
                                        a11ySuggestionsListLabel={"Suggested mentions"}
                                    >
                                        <Mention
                                            trigger="@"
                                            markup="@[__display__](__id__)"
                                            displayTransform={(id, display) => `@${display}`}
                                            data={projectMembers.filter(m => m.id !== currentUserId).map(m => ({ id: String(m.id), display: String(m.name || m.id) }))}
                                            renderSuggestion={renderSuggestion}
                                            style={{ backgroundColor: "var(--primary)", opacity: 0.2, borderRadius: "2px" }}
                                        />
                                    </MentionsInput>

                                    <div className="flex justify-between items-center mt-2">
                                        <div className="flex items-center gap-2">
                                            <input
                                                type="file"
                                                className="hidden"
                                                ref={fileInputRef}
                                                disabled={isPending}
                                                onChange={(e) => {
                                                    if (e.target.files && e.target.files[0]) {
                                                        setAttachment(e.target.files[0]);
                                                    }
                                                }}
                                            />
                                            <Button
                                                type="button"
                                                variant="outline"
                                                size="sm"
                                                className="h-8"
                                                onClick={() => fileInputRef.current?.click()}
                                                disabled={isPending}
                                            >
                                                <Paperclip className="h-4 w-4 mr-1" />
                                                Attachments
                                            </Button>
                                            {attachment && (
                                                <div className="flex items-center gap-2 bg-muted/50 px-2 py-1 rounded-md text-xs">
                                                    <span className="truncate max-w-[150px]">{attachment.name}</span>
                                                    <button
                                                        onClick={() => {
                                                            setAttachment(null);
                                                            if (fileInputRef.current) fileInputRef.current.value = "";
                                                        }}
                                                        className="text-muted-foreground hover:text-destructive"
                                                    >
                                                        <X className="h-3 w-3" />
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                                <Button
                                    size="sm"
                                    onClick={handleReply}
                                    disabled={isPending || (!replyContent.trim() && !attachment)}
                                    className="shrink-0 self-end"
                                >
                                    <Send className="h-3.5 w-3.5" />
                                </Button>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {item.replies && item.replies.length > 0 && (
                <div className="mb-2">
                    <button
                        onClick={() => setShowReplies(!showReplies)}
                        className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground mb-2 ml-12"
                    >
                        {showReplies ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
                        {item.replies.length} {item.replies.length === 1 ? "reply" : "replies"}
                    </button>
                    {showReplies && item.replies.map((reply) => (
                        <DiscussionReply
                            key={reply.id}
                            item={reply}
                            onReply={onReply}
                            onDelete={onDelete}
                            isPending={isPending}
                            currentUserId={currentUserId}
                            projectMembers={projectMembers}
                            depth={depth + 1}
                        />
                    ))}
                </div>
            )}
        </div>
    );
};

export const ProjectDiscussion = ({ projectId, currentUserId, isParticipant, projectMembers }: ProjectDiscussionProps) => {
    const [discussions, setDiscussions] = useState<DiscussionItem[]>([]);
    const [newContent, setNewContent] = useState("");
    const [isPending, startTransition] = useTransition();
    const [deleteId, setDeleteId] = useState<string | null>(null);
    const [attachment, setAttachment] = useState<File | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        getDiscussions(projectId).then(setDiscussions);
    }, [projectId]);

    const handleCreate = (parentId?: string, content?: string, attachmentFile?: File | null) => {
        const text = content || newContent;
        if (!text.trim() && !attachmentFile) return;

        startTransition(async () => {
            let finalAttachmentUrl = undefined;
            let finalAttachmentName = undefined;

            if (attachmentFile) {
                const { uploadUrl, fileUrl, error } = await getDiscussionUploadUrl(attachmentFile.name, attachmentFile.type, projectId);
                if (uploadUrl && fileUrl && !error) {
                    try {
                        const response = await fetch(uploadUrl, {
                            method: "PUT",
                            body: attachmentFile,
                            headers: { "Content-Type": attachmentFile.type },
                        });
                        if (response.ok) {
                            finalAttachmentUrl = fileUrl;
                            finalAttachmentName = attachmentFile.name;
                        } else {
                            alert("Failed to upload file");
                            return;
                        }
                    } catch (e) {
                        alert("Error uploading file");
                        return;
                    }
                } else {
                    alert(error || "Failed to generate upload URL");
                    return;
                }
            }

            createDiscussion(projectId, text, parentId, finalAttachmentUrl, finalAttachmentName).then((result) => {
                if (result.discussion) {
                    if (!parentId) {
                        setDiscussions(prev => [result.discussion as unknown as DiscussionItem, ...prev]);
                        setNewContent("");
                        setAttachment(null);
                        if (fileInputRef.current) fileInputRef.current.value = "";
                    } else {
                        getDiscussions(projectId).then(setDiscussions);
                    }
                }
            });
        });
    };

    const handleDeleteClick = (id: string) => {
        setDeleteId(id);
    };

    const confirmDelete = () => {
        if (!deleteId) return;

        startTransition(() => {
            deleteDiscussion(deleteId).then(() => {
                getDiscussions(projectId).then(setDiscussions);
                setDeleteId(null);
            });
        });
    };

    return (
        <Card className="p-6">
            <div className="flex items-center gap-2 mb-6">
                <MessageSquare className="h-5 w-5" />
                <h3 className="text-lg font-semibold">Discussion</h3>
                <span className="text-sm text-muted-foreground">({discussions.length})</span>
            </div>

            {/* New comment input */}
            {isParticipant ? (
                <div className="flex gap-3 mb-8">
                    <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-1">
                        <span className="text-sm font-semibold">Y</span>
                    </div>
                    <div className="flex-1 space-y-2">
                        <MentionsInput
                            value={newContent || ""}
                            onChange={(e, newValue) => setNewContent(newValue)}
                            style={mentionsInputStyle}
                            placeholder="Start a discussion... (use @ to mention)"
                            className="w-full min-h-[80px] text-sm border border-input rounded-md bg-transparent focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2 focus-within:ring-offset-background"
                            disabled={isPending}
                            onKeyDown={(e: any) => {
                                if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
                                    handleCreate();
                                }
                            }}
                            a11ySuggestionsListLabel={"Suggested mentions"}
                        >
                            <Mention
                                trigger="@"
                                markup="@[__display__](__id__)"
                                displayTransform={(id, display) => `@${display}`}
                                data={projectMembers.filter(m => m.id !== currentUserId).map(m => ({ id: String(m.id), display: String(m.name || m.id) }))}
                                renderSuggestion={renderSuggestion}
                                style={{ backgroundColor: "var(--primary)", opacity: 0.2, borderRadius: "2px" }}
                            />
                        </MentionsInput>
                        <div className="flex justify-between items-center">
                            <div className="flex items-center gap-2">
                                <input
                                    type="file"
                                    className="hidden"
                                    ref={fileInputRef}
                                    disabled={isPending}
                                    onChange={(e) => {
                                        if (e.target.files && e.target.files[0]) {
                                            setAttachment(e.target.files[0]);
                                        }
                                    }}
                                />
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    className="h-8"
                                    onClick={() => fileInputRef.current?.click()}
                                    disabled={isPending}
                                >
                                    <Paperclip className="h-4 w-4 mr-1" />
                                    Attachments
                                </Button>
                                {attachment && (
                                    <div className="flex items-center gap-2 bg-muted/50 px-2 py-1 rounded-md text-xs">
                                        <span className="truncate max-w-[150px]">{attachment.name}</span>
                                        <button
                                            onClick={() => {
                                                setAttachment(null);
                                                if (fileInputRef.current) fileInputRef.current.value = "";
                                            }}
                                            className="text-muted-foreground hover:text-destructive"
                                        >
                                            <X className="h-3 w-3" />
                                        </button>
                                    </div>
                                )}
                            </div>
                            <Button
                                onClick={() => handleCreate(undefined, undefined, attachment)}
                                disabled={isPending || (!newContent.trim() && !attachment)}
                                size="sm"
                            >
                                <Send className="h-4 w-4 mr-2" />
                                Post
                            </Button>
                        </div>
                    </div>
                </div>
            ) : (
                <div className="text-sm text-muted-foreground bg-muted/30 rounded-md p-4 mb-8 text-center">
                    Only project owner and assigned members can participate in discussions.
                </div>
            )}

            {discussions.length > 0 && <Separator className="mb-4" />}

            {/* Discussion threads */}
            <div className="space-y-1">
                {discussions.map((item, index) => (
                    <div key={item.id}>
                        <DiscussionReply
                            item={item}
                            onReply={(parentId, content) => handleCreate(parentId, content)}
                            onDelete={handleDeleteClick}
                            isPending={isPending}
                            currentUserId={currentUserId}
                            projectMembers={projectMembers}
                        />
                        {index < discussions.length - 1 && <Separator />}
                    </div>
                ))}
            </div>

            {discussions.length === 0 && (
                <p className="text-center text-sm text-muted-foreground py-10">
                    No discussions yet. Start one above!
                </p>
            )}


            <AlertConfirmation
                open={!!deleteId}
                onOpenChange={(open) => !open && setDeleteId(null)}
                title="Delete Comment"
                description="Are you sure you want to delete this comment?"
                onConfirm={confirmDelete}
                isPending={isPending}
            />
        </Card >
    );
};

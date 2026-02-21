"use client";

import { useState, useTransition, useEffect } from "react";
import { MessageSquare, Send, Trash2, Reply, ChevronDown, ChevronRight } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { getDiscussions, createDiscussion, deleteDiscussion } from "@/actions/discussions";
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
};

interface ProjectDiscussionProps {
    projectId: string;
    currentUserId: string;
    isParticipant: boolean;
}

const DiscussionReply = ({
    item,
    onReply,
    onDelete,
    isPending,
    currentUserId,
    depth = 0,
}: {
    item: DiscussionItem;
    onReply: (parentId: string, content: string) => void;
    onDelete: (id: string) => void;
    isPending: boolean;
    currentUserId: string;
    depth?: number;
}) => {
    const [showReplyInput, setShowReplyInput] = useState(false);
    const [replyContent, setReplyContent] = useState("");
    const [showReplies, setShowReplies] = useState(true);

    const isOwner = item.user.id === currentUserId;

    const handleReply = () => {
        if (!replyContent.trim()) return;
        onReply(item.id, replyContent);
        setReplyContent("");
        setShowReplyInput(false);
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
                        <p className="text-sm mt-1.5 whitespace-pre-wrap leading-relaxed">{item.content}</p>
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
                                <Textarea
                                    placeholder="Write a reply..."
                                    value={replyContent}
                                    onChange={(e) => setReplyContent(e.target.value)}
                                    className="min-h-[60px] text-sm"
                                    disabled={isPending}
                                    onKeyDown={(e) => {
                                        if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
                                            handleReply();
                                        }
                                    }}
                                />
                                <Button
                                    size="sm"
                                    onClick={handleReply}
                                    disabled={isPending || !replyContent.trim()}
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
                            depth={depth + 1}
                        />
                    ))}
                </div>
            )}
        </div>
    );
};

export const ProjectDiscussion = ({ projectId, currentUserId, isParticipant }: ProjectDiscussionProps) => {
    const [discussions, setDiscussions] = useState<DiscussionItem[]>([]);
    const [newContent, setNewContent] = useState("");
    const [isPending, startTransition] = useTransition();
    const [deleteId, setDeleteId] = useState<string | null>(null);

    useEffect(() => {
        getDiscussions(projectId).then(setDiscussions);
    }, [projectId]);

    const handleCreate = (parentId?: string, content?: string) => {
        const text = content || newContent;
        if (!text.trim()) return;

        startTransition(() => {
            createDiscussion(projectId, text, parentId).then((result) => {
                if (result.discussion) {
                    if (!parentId) {
                        setDiscussions(prev => [result.discussion as unknown as DiscussionItem, ...prev]);
                        setNewContent("");
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
        <Card className="p-6 mb-8">
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
                        <Textarea
                            placeholder="Start a discussion..."
                            value={newContent}
                            onChange={(e) => setNewContent(e.target.value)}
                            className="min-h-[80px]"
                            disabled={isPending}
                            onKeyDown={(e) => {
                                if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
                                    handleCreate();
                                }
                            }}
                        />
                        <div className="flex justify-between items-center">
                            <span className="text-xs text-muted-foreground">
                                Press Ctrl+Enter to post
                            </span>
                            <Button
                                onClick={() => handleCreate()}
                                disabled={isPending || !newContent.trim()}
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

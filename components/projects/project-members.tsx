"use client";

import { useState, useTransition, useEffect } from "react";
import { Plus, X, Users, UserPlus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { getUsers } from "@/actions/users";
import { addProjectMember, removeProjectMember } from "@/actions/members";
import { AlertConfirmation } from "@/components/ui/alert-confirmation";

type MemberUser = {
    id: string;
    name: string | null;
    email: string | null;
};

interface ProjectMembersProps {
    projectId: string;
    ownerId: string;
    currentUserId: string;
    initialMembers: MemberUser[];
    ownerName: string;
}

export const ProjectMembers = ({
    projectId,
    ownerId,
    currentUserId,
    initialMembers,
    ownerName,
}: ProjectMembersProps) => {
    const [members, setMembers] = useState<MemberUser[]>(initialMembers);
    const [allUsers, setAllUsers] = useState<MemberUser[]>([]);
    const [isPending, startTransition] = useTransition();
    const [open, setOpen] = useState(false);
    const [search, setSearch] = useState("");
    const [memberToRemove, setMemberToRemove] = useState<string | null>(null);

    const isOwner = currentUserId === ownerId;

    useEffect(() => {
        if (open) {
            getUsers().then(setAllUsers);
        }
    }, [open]);

    const availableUsers = allUsers.filter(
        (u) =>
            u.id !== ownerId &&
            !members.some((m) => m.id === u.id) &&
            (u.name?.toLowerCase().includes(search.toLowerCase()) ||
                u.email?.toLowerCase().includes(search.toLowerCase()))
    );

    const handleAdd = (user: MemberUser) => {
        startTransition(() => {
            addProjectMember(projectId, user.id).then((result) => {
                if (result.success) {
                    setMembers((prev) => [...prev, user]);
                    setSearch("");
                }
            });
        });
    };

    const handleRemoveClick = (userId: string) => {
        setMemberToRemove(userId);
    };

    const confirmRemove = () => {
        if (!memberToRemove) return;

        startTransition(() => {
            removeProjectMember(projectId, memberToRemove).then((result) => {
                if (result.success) {
                    setMembers((prev) => prev.filter((m) => m.id !== memberToRemove));
                    setMemberToRemove(null);
                }
            });
        });
    };

    return (
        <Card className="p-4">
            <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-muted-foreground" />
                    <h3 className="text-sm font-semibold">Members</h3>
                    <span className="text-xs text-muted-foreground">
                        ({members.length + 1})
                    </span>
                </div>
                {isOwner && (
                    <Dialog open={open} onOpenChange={setOpen}>
                        <DialogTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-7 text-xs">
                                <UserPlus className="h-3.5 w-3.5 mr-1" />
                                Add
                            </Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Add Member</DialogTitle>
                            </DialogHeader>
                            <div className="space-y-3">
                                <Input
                                    placeholder="Search users..."
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    disabled={isPending}
                                />
                                <div className="max-h-[240px] overflow-y-auto space-y-1">
                                    {availableUsers.map((user) => (
                                        <button
                                            key={user.id}
                                            onClick={() => handleAdd(user)}
                                            disabled={isPending}
                                            className="w-full flex items-center gap-3 p-2 rounded-md hover:bg-accent text-left"
                                        >
                                            <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                                                <span className="text-xs font-semibold">
                                                    {user.name?.charAt(0)?.toUpperCase() || "?"}
                                                </span>
                                            </div>
                                            <div>
                                                <div className="text-sm font-medium">{user.name}</div>
                                                <div className="text-xs text-muted-foreground">{user.email}</div>
                                            </div>
                                        </button>
                                    ))}
                                    {availableUsers.length === 0 && (
                                        <p className="text-sm text-muted-foreground text-center py-4">
                                            No users available
                                        </p>
                                    )}
                                </div>
                            </div>
                        </DialogContent>
                    </Dialog>
                )}
            </div>

            <div className="flex flex-wrap gap-2">
                {/* Owner */}
                <Badge variant="default" className="gap-1.5 py-1">
                    <div className="h-5 w-5 rounded-full bg-primary-foreground/20 flex items-center justify-center">
                        <span className="text-[10px] font-bold">
                            {ownerName.charAt(0).toUpperCase()}
                        </span>
                    </div>
                    {ownerName}
                    <span className="text-[10px] opacity-70">Owner</span>
                </Badge>

                {/* Members */}
                {members.map((member) => (
                    <Badge key={member.id} variant="secondary" className="gap-1.5 py-1 pr-1">
                        <div className="h-5 w-5 rounded-full bg-primary/10 flex items-center justify-center">
                            <span className="text-[10px] font-semibold">
                                {member.name?.charAt(0)?.toUpperCase() || "?"}
                            </span>
                        </div>
                        {member.name || member.email}
                        {isOwner && (
                            <button
                                onClick={() => handleRemoveClick(member.id)}
                                disabled={isPending}
                                className="ml-0.5 rounded-full hover:bg-muted-foreground/20 p-0.5"
                            >
                                <X className="h-3 w-3" />
                            </button>
                        )}
                    </Badge>
                ))}

                {members.length === 0 && (
                    <span className="text-xs text-muted-foreground">No members assigned yet</span>
                )}
            </div>


            <AlertConfirmation
                open={!!memberToRemove}
                onOpenChange={(open) => !open && setMemberToRemove(null)}
                title="Remove Member"
                description="Are you sure you want to remove this member from the project?"
                onConfirm={confirmRemove}
                isPending={isPending}
            />
        </Card >
    );
};

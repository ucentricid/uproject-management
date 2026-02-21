"use client";

import dynamic from "next/dynamic";
import "react-quill-new/dist/quill.snow.css";

const ReactQuill = dynamic(() => import("react-quill-new"), { ssr: false });
import * as z from "zod";
import { useState, useTransition, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ProjectSchema } from "@/schemas";
import { Input } from "@/components/ui/input";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { FormError } from "@/components/form-error";
import { FormSuccess } from "@/components/form-success";
import { createProject } from "@/actions/projects";
import { getUsers } from "@/actions/users";
import { Badge } from "@/components/ui/badge";
import { X, Check } from "lucide-react";

import { Project } from "@prisma/client";

interface CreateProjectFormProps {
    onSuccess?: (project?: Project) => void;
    currentUserId?: string;
}

type SimpleUser = {
    id: string;
    name: string | null;
    email: string | null;
};

export const CreateProjectForm = ({ onSuccess, currentUserId }: CreateProjectFormProps) => {
    const [error, setError] = useState<string | undefined>("");
    const [success, setSuccess] = useState<string | undefined>("");
    const [isPending, startTransition] = useTransition();
    const [users, setUsers] = useState<SimpleUser[]>([]);
    const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
    const [userSearch, setUserSearch] = useState("");
    const [showDropdown, setShowDropdown] = useState(false);

    useEffect(() => {
        getUsers().then((fetchedUsers) => {
            if (currentUserId) {
                setUsers(fetchedUsers.filter(u => u.id !== currentUserId));
            } else {
                setUsers(fetchedUsers);
            }
        });
    }, [currentUserId]);

    const form = useForm<z.infer<typeof ProjectSchema>>({
        resolver: zodResolver(ProjectSchema),
        defaultValues: {
            name: "",
            description: "",
        },
    });

    const toggleUser = (userId: string) => {
        setSelectedUserIds(prev =>
            prev.includes(userId)
                ? prev.filter(id => id !== userId)
                : [...prev, userId]
        );
    };

    const filteredUsers = users.filter(u =>
        (u.name?.toLowerCase().includes(userSearch.toLowerCase()) ||
            u.email?.toLowerCase().includes(userSearch.toLowerCase())) &&
        !selectedUserIds.includes(u.id)
    );

    const onSubmit = (values: z.infer<typeof ProjectSchema>) => {
        setError("");
        setSuccess("");

        startTransition(() => {
            createProject(values, selectedUserIds)
                .then((data) => {
                    if (data?.error) {
                        setError(data.error);
                    }
                    if (data?.success) {
                        if (onSuccess) {
                            onSuccess(data.project);
                        }
                    }
                });
        });
    };

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <div className="space-y-4">
                    <FormField
                        control={form.control}
                        name="name"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Project Name</FormLabel>
                                <FormControl>
                                    <Input
                                        {...field}
                                        disabled={isPending}
                                        placeholder="My Awesome Project"
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
                                    <div className="bg-background rounded-md">
                                        <ReactQuill
                                            theme="snow"
                                            value={field.value || ""}
                                            onChange={field.onChange}
                                            placeholder="Describe your project goals, timelines, etc..."
                                            className="h-[150px] mb-12"
                                        />
                                    </div>
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    {/* Members Multi-Select */}
                    <div className="space-y-2">
                        <label className="text-sm font-medium">Members</label>

                        {/* Selected members */}
                        {selectedUserIds.length > 0 && (
                            <div className="flex flex-wrap gap-1.5 mb-2">
                                {selectedUserIds.map(id => {
                                    const user = users.find(u => u.id === id);
                                    return (
                                        <Badge key={id} variant="secondary" className="gap-1 pr-1">
                                            {user?.name || user?.email}
                                            <button
                                                type="button"
                                                onClick={() => toggleUser(id)}
                                                className="ml-1 rounded-full hover:bg-muted-foreground/20 p-0.5"
                                            >
                                                <X className="h-3 w-3" />
                                            </button>
                                        </Badge>
                                    );
                                })}
                            </div>
                        )}

                        {/* Search input */}
                        <div className="relative">
                            <Input
                                placeholder="Search users to add..."
                                value={userSearch}
                                onChange={(e) => {
                                    setUserSearch(e.target.value);
                                    setShowDropdown(true);
                                }}
                                onFocus={() => setShowDropdown(true)}
                                onBlur={() => setTimeout(() => setShowDropdown(false), 150)}
                                disabled={isPending}
                            />

                            {/* Dropdown */}
                            {showDropdown && (
                                <div className="absolute z-50 w-full mt-1 bg-popover border rounded-md shadow-md max-h-[160px] overflow-y-auto">
                                    {filteredUsers.length > 0 ? (
                                        filteredUsers.map(user => (
                                            <button
                                                key={user.id}
                                                type="button"
                                                onClick={() => {
                                                    toggleUser(user.id);
                                                    setUserSearch("");
                                                    setShowDropdown(false);
                                                }}
                                                className="w-full text-left px-3 py-2 text-sm hover:bg-accent flex items-center justify-between"
                                            >
                                                <div>
                                                    <span className="font-medium">{user.name}</span>
                                                    <span className="text-muted-foreground ml-2 text-xs">{user.email}</span>
                                                </div>
                                            </button>
                                        ))
                                    ) : (
                                        <div className="px-3 py-2 text-sm text-muted-foreground">
                                            No users found
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
                <FormError message={error} />
                <FormSuccess message={success} />
                <Button
                    disabled={isPending}
                    type="submit"
                    className="w-full"
                >
                    Create Project
                </Button>
            </form>
        </Form>
    );
};

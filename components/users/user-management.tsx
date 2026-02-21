"use client";

import { useState, useTransition, useEffect } from "react";
import { Plus, Trash2, Users, Pencil } from "lucide-react";

import { Button } from "@/components/ui/button";


import { Input } from "@/components/ui/input";
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

import { Badge } from "@/components/ui/badge";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { getUsers, createUser, deleteUser } from "@/actions/users";
import { AlertConfirmation } from "@/components/ui/alert-confirmation";
import { EditUserDialog } from "@/components/users/edit-user-dialog";

type UserItem = {
    id: string;
    name: string | null;
    email: string | null;
    role: string;
};

export const UserManagement = () => {
    const [users, setUsers] = useState<UserItem[]>([]);
    const [isPending, startTransition] = useTransition();
    const [open, setOpen] = useState(false);
    const [formData, setFormData] = useState({
        name: "",
        email: "",
        role: "MEMBER" as "ADMIN" | "MEMBER",
    });
    const [error, setError] = useState("");

    const [userToDelete, setUserToDelete] = useState<string | null>(null);
    const [userToEdit, setUserToEdit] = useState<UserItem | null>(null);

    useEffect(() => {
        getUsers().then(setUsers);
    }, []);

    const handleCreate = () => {
        setError("");
        if (!formData.name || !formData.email) {
            setError("Name and Email are required");
            return;
        }

        startTransition(() => {
            createUser(formData).then((result) => {
                if (result.error) {
                    setError(result.error);
                    return;
                }
                if (result.user) {
                    setUsers(prev => [...prev, result.user!]);
                    setFormData({ name: "", email: "", role: "MEMBER" });
                    setOpen(false);
                }
            });
        });
    };

    const handleDeleteClick = (userId: string) => {
        setUserToDelete(userId);
    };

    const confirmDelete = () => {
        if (!userToDelete) return;

        startTransition(() => {
            deleteUser(userToDelete).then((result) => {
                if (result.error) {
                    alert(result.error);
                } else {
                    setUsers(prev => prev.filter(u => u.id !== userToDelete));
                }
                setUserToDelete(null);
            });
        });
    };



    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight">User Management</h2>
                    <p className="text-muted-foreground">Manage users</p>
                </div>
                <Dialog open={open} onOpenChange={setOpen}>
                    <DialogTrigger asChild>
                        <Button>
                            <Plus className="mr-2 h-4 w-4" />
                            Add User
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Add New User</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Name</label>
                                <Input
                                    placeholder="John Doe"
                                    value={formData.name}
                                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                                    disabled={isPending}
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Email</label>
                                <Input
                                    placeholder="john@example.com"
                                    type="email"
                                    value={formData.email}
                                    onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                                    disabled={isPending}
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium">Role</label>
                                <Select
                                    value={formData.role}
                                    onValueChange={(v) => setFormData(prev => ({ ...prev, role: v as "ADMIN" | "MEMBER" }))}
                                    disabled={isPending}
                                >
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="ADMIN">Admin</SelectItem>
                                        <SelectItem value="MEMBER">Member</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            {error && (
                                <p className="text-sm text-destructive">{error}</p>
                            )}
                            <Button
                                onClick={handleCreate}
                                disabled={isPending}
                                className="w-full"
                            >
                                {isPending ? "Creating..." : "Create User"}
                            </Button>
                        </div>
                    </DialogContent>
                </Dialog>
            </div>

            <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium">Total Users</CardTitle>
                    <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{users.length}</div>
                </CardContent>
            </Card>

            <Card>
                <CardContent className="p-0">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Name</TableHead>
                                <TableHead>Email</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {users.map((user) => (
                                <TableRow key={user.id}>
                                    <TableCell className="font-medium">
                                        <div className="flex items-center gap-3">
                                            <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                                                <span className="text-sm font-semibold">
                                                    {user.name?.charAt(0)?.toUpperCase() || "?"}
                                                </span>
                                            </div>
                                            {user.name || "—"}
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-muted-foreground">
                                        {user.email || "—"}
                                    </TableCell>

                                    <TableCell className="text-right">
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="mr-1"
                                            onClick={() => setUserToEdit(user)}
                                            disabled={isPending}
                                        >
                                            <Pencil className="h-4 w-4" />
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="text-muted-foreground hover:text-destructive"
                                            onClick={() => handleDeleteClick(user.id)}
                                            disabled={isPending}
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))}
                            {users.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={3} className="text-center text-muted-foreground py-8">
                                        No users found
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>


            <AlertConfirmation
                open={!!userToDelete}
                onOpenChange={(open) => !open && setUserToDelete(null)}
                title="Delete User"
                description="Are you sure you want to delete this user? This action cannot be undone."
                onConfirm={confirmDelete}
                isPending={isPending}
            />

            <EditUserDialog
                open={!!userToEdit}
                onOpenChange={(open) => !open && setUserToEdit(null)}
                user={userToEdit}
                onSuccess={(updatedUser) => {
                    setUsers(prev => prev.map(u => u.id === updatedUser.id ? updatedUser : u));
                }}
            />
        </div >
    );
};

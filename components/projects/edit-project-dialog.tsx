"use client";

import * as z from "zod";
import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ProjectSchema } from "@/schemas";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { updateProject } from "@/actions/projects";
import { useRouter } from "next/navigation";
import { Pencil } from "lucide-react";

interface EditProjectDialogProps {
    project: {
        id: string;
        name: string;
        key: string;
        description: string | null;
    };
}

export const EditProjectDialog = ({ project }: EditProjectDialogProps) => {
    const [open, setOpen] = useState(false);
    const [error, setError] = useState<string | undefined>("");
    const [success, setSuccess] = useState<string | undefined>("");
    const [isPending, startTransition] = useTransition();
    const router = useRouter();

    const form = useForm<z.infer<typeof ProjectSchema>>({
        resolver: zodResolver(ProjectSchema),
        defaultValues: {
            name: project.name,
            key: project.key,
            description: project.description || "",
        },
    });

    const onSubmit = (values: z.infer<typeof ProjectSchema>) => {
        setError("");
        setSuccess("");

        startTransition(() => {
            updateProject(project.id, values)
                .then((data) => {
                    if (data?.error) {
                        form.reset();
                        setError(data.error);
                    }
                    if (data?.success) {
                        form.reset();
                        setSuccess(data.success);
                        setOpen(false);
                        router.refresh();
                    }
                });
        });
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                    <Pencil className="h-4 w-4" />
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Edit Project</DialogTitle>
                </DialogHeader>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <FormField
                            control={form.control}
                            name="name"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Project Name</FormLabel>
                                    <FormControl>
                                        <Input
                                            {...field}
                                            placeholder="My Awesome Project"
                                            disabled={isPending}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="key"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Project Key</FormLabel>
                                    <FormControl>
                                        <Input
                                            {...field}
                                            placeholder="MAP"
                                            disabled={true} // Key is identifying, safer to disable edit for now
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
                                        <Textarea
                                            {...field}
                                            placeholder="Describe your project..."
                                            disabled={isPending}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        {error && (
                            <div className="bg-destructive/15 p-3 rounded-md flex items-center gap-x-2 text-sm text-destructive">
                                <p>{error}</p>
                            </div>
                        )}
                        {success && (
                            <div className="bg-emerald-500/15 p-3 rounded-md flex items-center gap-x-2 text-sm text-emerald-500">
                                <p>{success}</p>
                            </div>
                        )}
                        <Button
                            type="submit"
                            className="w-full"
                            disabled={isPending}
                        >
                            Save Changes
                        </Button>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
};

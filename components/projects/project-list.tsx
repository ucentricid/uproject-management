"use client";

import { Project } from "@prisma/client";
import { Plus } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
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
import { CreateProjectForm } from "@/components/projects/create-project-form";

interface ProjectListProps {
    projects: Project[];
    currentUserRole?: "ADMIN" | "MEMBER";
    currentUserId?: string;
}

export const ProjectList = ({ projects: initialProjects, currentUserRole, currentUserId }: ProjectListProps) => {
    const [open, setOpen] = useState(false);
    const [projects, setProjects] = useState<Project[]>(initialProjects);

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h2 className="text-3xl font-bold tracking-tight">Projects</h2>
                {currentUserRole === "ADMIN" && (
                    <Dialog open={open} onOpenChange={setOpen}>
                        <DialogTrigger asChild>
                            <Button>
                                <Plus className="mr-2 h-4 w-4" />
                                Create Project
                            </Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Create New Project</DialogTitle>
                            </DialogHeader>
                            <CreateProjectForm
                                onSuccess={(newProject) => {
                                    if (newProject) {
                                        setProjects(prev => [newProject, ...prev]);
                                    }
                                    setOpen(false);
                                }}
                                currentUserId={currentUserId}
                            />
                        </DialogContent>
                    </Dialog>
                )}
            </div>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {projects.map((project) => (
                    <Link
                        key={project.id}
                        href={`/dashboard/projects/${project.id}`}
                        className="block"
                    >
                        <Card className="h-full transition-transform hover:scale-[1.01] hover:shadow-md cursor-pointer">
                            <CardHeader>
                                <CardTitle>{project.name}</CardTitle>
                                <CardDescription>Key: {project.key}</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <p className="text-sm text-muted-foreground line-clamp-2">
                                    {project.description || "No description provided."}
                                </p>
                            </CardContent>
                            <CardFooter>
                                <p className="text-xs text-muted-foreground">
                                    Created {new Date(project.createdAt).toLocaleDateString()}
                                </p>
                            </CardFooter>
                        </Card>
                    </Link>
                ))}
                {projects.length === 0 && (
                    <div className="col-span-full flex flex-col items-center justify-center p-8 border rounded-lg border-dashed text-muted-foreground">
                        <p>No projects found. Create one to get started!</p>
                    </div>
                )}
            </div>
        </div>
    );
};

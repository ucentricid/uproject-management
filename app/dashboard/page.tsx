import { auth } from "@/auth";
import { db } from "@/lib/db";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle2, CircleDashed, FolderKanban, MessageSquare } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

const DashboardPage = async () => {
    const session = await auth();

    let totalProjects = 0;
    let activeTasks = 0;
    let completedTasks = 0;
    let totalDiscussions = 0;
    let recentProjects = [];

    if (session?.user?.id) {
        const userId = session.user.id;

        const projectWhere = {
            OR: [
                { ownerId: userId },
                { members: { some: { id: userId } } }
            ]
        };

        const [
            projectsCount,
            activeTasksCount,
            completedTasksCount,
            discussionsCount,
            projectsData
        ] = await Promise.all([
            // Total Projects
            db.project.count({ where: projectWhere }),

            // Active Tasks assigned to user
            db.issue.count({
                where: {
                    assigneeId: userId,
                    status: { in: ["TODO", "IN_PROGRESS"] },
                    type: "TASK"
                }
            }),

            // Completed Tasks assigned to user
            db.issue.count({
                where: {
                    assigneeId: userId,
                    status: "DONE",
                    type: "TASK"
                }
            }),

            // Total Discussions started by user
            db.discussion.count({
                where: { userId }
            }),

            // Recent Projects
            db.project.findMany({
                where: projectWhere,
                orderBy: { createdAt: "desc" },
                take: 5
            })
        ]);

        totalProjects = projectsCount;
        activeTasks = activeTasksCount;
        completedTasks = completedTasksCount;
        totalDiscussions = discussionsCount;
        recentProjects = projectsData;
    }

    return (
        <div className="flex flex-col gap-6 p-8">
            <h1 className="text-3xl font-bold tracking-tight">Dashboard Overview</h1>
            <p className="text-muted-foreground">
                Welcome back, {session?.user?.name || "User"}! Here's what's happening.
            </p>

            {/* Analytics Grid */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="tracking-tight text-sm font-medium">Total Projects</CardTitle>
                        <FolderKanban className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{totalProjects}</div>
                        <p className="text-xs text-muted-foreground">Projects you're involved in</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="tracking-tight text-sm font-medium">Active Tasks</CardTitle>
                        <CircleDashed className="h-4 w-4 text-blue-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{activeTasks}</div>
                        <p className="text-xs text-muted-foreground">Tasks assigned to you</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="tracking-tight text-sm font-medium">Completed Tasks</CardTitle>
                        <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{completedTasks}</div>
                        <p className="text-xs text-muted-foreground">Tasks marked as done</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="tracking-tight text-sm font-medium">Discussions</CardTitle>
                        <MessageSquare className="h-4 w-4 text-orange-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{totalDiscussions}</div>
                        <p className="text-xs text-muted-foreground">Threads you've started</p>
                    </CardContent>
                </Card>
            </div>

            {/* Recent Activity / Projects */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7 mt-4">
                <Card className="col-span-4">
                    <CardHeader>
                        <CardTitle>Recent Projects</CardTitle>
                        <CardDescription>
                            Your most recently active workspaces.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        {recentProjects.length === 0 ? (
                            <div className="text-center py-8 text-muted-foreground">
                                <p>No projects found.</p>
                                <Button asChild variant="outline" className="mt-4">
                                    <Link href="/dashboard/projects">Create Your First Project</Link>
                                </Button>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {recentProjects.map((project: any) => (
                                    <div key={project.id} className="flex items-center justify-between p-4 border rounded-lg">
                                        <div className="flex items-center gap-4">
                                            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                                                <FolderKanban className="h-5 w-5 text-primary" />
                                            </div>
                                            <div>
                                                <p className="font-medium">{project.name}</p>
                                                <p className="text-sm text-muted-foreground">{project.key}</p>
                                            </div>
                                        </div>
                                        <Button asChild variant="ghost" size="sm">
                                            <Link href={`/dashboard/projects/${project.id}`}>
                                                Open Board
                                            </Link>
                                        </Button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>

                <Card className="col-span-3">
                    <CardHeader>
                        <CardTitle>Quick Tips</CardTitle>
                        <CardDescription>Get the most out of Ucentric.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4 text-sm">
                        <div className="flex gap-3 items-start">
                            <CheckCircle2 className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                            <p><strong>Organize Issues:</strong> Drag and drop tasks in your project board to easily update their status.</p>
                        </div>
                        <div className="flex gap-3 items-start">
                            <MessageSquare className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                            <p><strong>Team Chat:</strong> Use the discussion tab to tag team members and collaborate seamlessly.</p>
                        </div>
                        <div className="flex gap-3 items-start">
                            <CircleDashed className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                            <p><strong>Sprints:</strong> Group tasks into sprints to help focus your team on the immediate priorities.</p>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}

export default DashboardPage;

import { getProject } from "@/actions/projects";
import { IssueBoard } from "@/components/projects/issue-board";
import { ProjectDiscussion } from "@/components/projects/project-discussion";
import { ProjectMembers } from "@/components/projects/project-members";
import { EditProjectDialog } from "@/components/projects/edit-project-dialog";
import { auth } from "@/auth";
import { notFound } from "next/navigation";

interface ProjectIdPageProps {
    params: Promise<{
        projectId: string;
    }>;
}

const ProjectIdPage = async ({ params }: ProjectIdPageProps) => {
    const { projectId } = await params;
    const [project, session] = await Promise.all([
        getProject(projectId),
        auth(),
    ]);

    if (!project) {
        return notFound();
    }

    const currentUserId = session?.user?.id || "";
    const currentUserRole = session?.user?.role;
    const isParticipant =
        project.ownerId === currentUserId ||
        project.members.some(m => m.id === currentUserId);

    return (
        <div className="flex-1 flex flex-col p-8 pt-6 h-[calc(100vh-4rem)] overflow-hidden">
            <div className="flex items-center justify-between mb-4 shrink-0">
                <div className="flex items-center gap-2">
                    <h2 className="text-3xl font-bold tracking-tight">{project.name}</h2>
                    {project.ownerId === currentUserId && (
                        <EditProjectDialog project={project} />
                    )}
                </div>
            </div>
            <div className="flex-1 overflow-y-auto space-y-6">
                {/* Members Section */}
                <ProjectMembers
                    projectId={project.id}
                    ownerId={project.ownerId}
                    currentUserId={currentUserId}
                    initialMembers={project.members}
                    ownerName={project.owner.name || project.owner.email || "Owner"}
                />

                {/* Board */}
                <div className="min-h-[500px]">
                    <IssueBoard
                        projectId={project.id}
                        columns={project.columns}
                        currentUserRole={currentUserRole}
                        isProjectOwner={project.ownerId === currentUserId}
                    />
                </div>

                {/* Discussion */}
                <ProjectDiscussion
                    projectId={project.id}
                    currentUserId={currentUserId}
                    isParticipant={isParticipant}
                    projectMembers={[
                        { id: project.owner.id, name: project.owner.name || project.owner.email || "Owner" },
                        ...project.members.map(m => ({ id: m.id, name: m.name || m.email || "Unknown" }))
                    ]}
                />
            </div>
        </div>
    );
};

export default ProjectIdPage;

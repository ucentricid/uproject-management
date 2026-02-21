import { getProject } from "@/actions/projects";
import { ProjectDiscussion } from "@/components/projects/project-discussion";
import { ProjectMembers } from "@/components/projects/project-members";
import { ProjectTabs } from "@/components/projects/project-tabs";
import { ProjectHeaderActions } from "@/components/projects/project-header-actions";
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
    const isParticipant =
        project.ownerId === currentUserId ||
        project.members.some(m => m.id === currentUserId);

    const hasIssues = project.columns.some(col => col.issues.length > 0);
    const hasDiscussions = project.discussions.length > 0;
    const canDelete = !hasIssues && !hasDiscussions;

    // Flatten all issues with column name for timeline
    const initialTimelineIssues = project.columns.flatMap(col =>
        col.issues.map(issue => ({ ...issue, columnName: col.name }))
    );

    return (
        <div className="flex flex-col p-8 pt-6 gap-4">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <h2 className="text-3xl font-bold tracking-tight">{project.name}</h2>
                    {project.ownerId === currentUserId && (
                        <ProjectHeaderActions project={project} canDelete={canDelete} />
                    )}
                </div>
            </div>

            <div className="flex flex-col gap-4">
                {/* Members Section */}
                <ProjectMembers
                    projectId={project.id}
                    ownerId={project.ownerId}
                    currentUserId={currentUserId}
                    initialMembers={project.members}
                    ownerName={project.owner.name || project.owner.email || "Owner"}
                />

                {/* Board / Timeline Tabs — shared client state */}
                <ProjectTabs
                    projectId={project.id}
                    columns={project.columns}
                    isProjectOwner={project.ownerId === currentUserId}
                    initialTimelineIssues={initialTimelineIssues}
                />

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

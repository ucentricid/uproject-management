import { getProjects } from "@/actions/projects";
import { ProjectList } from "@/components/projects/project-list";
import { auth } from "@/auth";

const ProjectsPage = async () => {
    const [projects, session] = await Promise.all([
        getProjects(),
        auth(),
    ]);

    const currentUserRole = session?.user?.role;
    const currentUserId = session?.user?.id;

    return (
        <div className="flex-1 space-y-4 p-8 pt-6">
            <ProjectList
                projects={projects}
                currentUserRole={currentUserRole}
                currentUserId={currentUserId}
            />
        </div>
    );
};

export default ProjectsPage;

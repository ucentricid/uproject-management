"use client";

import { EditProjectDialog } from "@/components/projects/edit-project-dialog";
import { DeleteProjectButton } from "@/components/projects/delete-project-button";

interface ProjectHeaderActionsProps {
    project: {
        id: string;
        name: string;
        key: string;
        description: string | null;
    };
    canDelete: boolean;
}

export const ProjectHeaderActions = ({ project, canDelete }: ProjectHeaderActionsProps) => {
    return (
        <div className="flex items-center gap-1">
            <EditProjectDialog project={project} />
            {canDelete && <DeleteProjectButton projectId={project.id} />}
        </div>
    );
};

"use client";

import { useState } from "react";
import { Issue, User, BoardColumn } from "@prisma/client";
import { LayoutGrid, GanttChartSquare } from "lucide-react";
import { IssueBoard } from "@/components/projects/issue-board";
import { ProjectTimeline } from "@/components/projects/project-timeline";

interface IssueWithAssignee extends Issue {
    assignee: User | null;
}

interface ColumnWithIssues extends BoardColumn {
    issues: IssueWithAssignee[];
}

type TimelineIssue = Issue & { columnName: string };

interface ProjectTabsProps {
    projectId: string;
    columns: ColumnWithIssues[];
    isProjectOwner: boolean;
    initialTimelineIssues: TimelineIssue[];
}

export const ProjectTabs = ({
    projectId,
    columns,
    isProjectOwner,
    initialTimelineIssues,
}: ProjectTabsProps) => {
    const [activeTab, setActiveTab] = useState<"board" | "timeline">("board");
    const [timelineIssues, setTimelineIssues] = useState<TimelineIssue[]>(initialTimelineIssues);

    return (
        <div>
            {/* Tab buttons */}
            <div className="flex items-center gap-1 mb-3 border-b">
                <button
                    onClick={() => setActiveTab("board")}
                    className={`flex items-center gap-1.5 px-3 py-2 text-sm font-medium border-b-2 transition-colors ${activeTab === "board"
                        ? "border-primary text-foreground"
                        : "border-transparent text-muted-foreground hover:text-foreground"
                        }`}
                >
                    <LayoutGrid className="h-3.5 w-3.5" />
                    Board
                </button>
                <button
                    onClick={() => setActiveTab("timeline")}
                    className={`flex items-center gap-1.5 px-3 py-2 text-sm font-medium border-b-2 transition-colors ${activeTab === "timeline"
                        ? "border-primary text-foreground"
                        : "border-transparent text-muted-foreground hover:text-foreground"
                        }`}
                >
                    <GanttChartSquare className="h-3.5 w-3.5" />
                    Timeline
                </button>
            </div>

            {/* Both panels always mounted — visibility toggled with CSS */}
            <div className={activeTab === "board" ? "block" : "hidden"}>
                <IssueBoard
                    projectId={projectId}
                    columns={columns}
                    isProjectOwner={isProjectOwner}
                    onIssueCreate={(issue) => {
                        setTimelineIssues(prev => [...prev, issue as unknown as TimelineIssue]);
                    }}
                    onIssueMove={(issueId, newColumnName) => {
                        setTimelineIssues(prev =>
                            prev.map(i => i.id === issueId ? { ...i, columnName: newColumnName } : i)
                        );
                    }}
                    onIssueUpdate={(issueId, updatedIssue) => {
                        setTimelineIssues(prev =>
                            prev.map(i => i.id === issueId ? { ...i, ...updatedIssue } : i)
                        );
                    }}
                />
            </div>

            <div className={activeTab === "timeline" ? "block" : "hidden"}>
                <ProjectTimeline issues={timelineIssues} />
            </div>
        </div>
    );
};

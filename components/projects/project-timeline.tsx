"use client";

import { Issue } from "@prisma/client";
import { format, differenceInDays, startOfDay, addDays, min, max } from "date-fns";
import { Calendar } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface IssueForTimeline extends Issue {
    dueDate: Date | null;
    columnName: string;
}

interface ProjectTimelineProps {
    issues: IssueForTimeline[];
}

const PRIORITY_COLORS: Record<string, string> = {
    URGENT: "bg-red-500",
    HIGH: "bg-orange-500",
    MEDIUM: "bg-blue-500",
    LOW: "bg-slate-400",
};

export const ProjectTimeline = ({ issues }: ProjectTimelineProps) => {
    const issuesWithDates = issues.filter(i => i.dueDate);

    if (issuesWithDates.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-20 text-muted-foreground gap-3">
                <Calendar className="h-10 w-10 opacity-30" />
                <p className="text-sm">No issues with due dates found.</p>
                <p className="text-xs">Set a due date on an issue to see it here.</p>
            </div>
        );
    }

    const today = startOfDay(new Date());
    const allDates = issuesWithDates.map(i => startOfDay(new Date(i.dueDate!)));
    const minDate = addDays(min([today, ...allDates]), -2);
    const maxDate = addDays(max([...allDates]), 3);
    const totalDays = differenceInDays(maxDate, minDate) + 1;

    const dayHeaders: Date[] = [];
    for (let i = 0; i < totalDays; i++) {
        dayHeaders.push(addDays(minDate, i));
    }

    return (
        <div className="overflow-x-auto">
            <div className="min-w-[700px]">
                {/* Header row */}
                <div className="flex border-b mb-2 text-xs text-muted-foreground">
                    <div className="w-48 shrink-0 px-3 py-2 font-medium">Issue</div>
                    <div className="flex flex-1 relative">
                        {dayHeaders.map((day, i) => {
                            const isToday = differenceInDays(day, today) === 0;
                            return (
                                <div
                                    key={i}
                                    className={`flex-1 text-center py-2 border-l text-[10px] leading-none ${isToday ? "bg-primary/5 font-semibold text-primary" : ""
                                        }`}
                                >
                                    <div>{format(day, "d")}</div>
                                    <div className="text-muted-foreground/60">{format(day, "MMM")}</div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Issue rows */}
                {issuesWithDates.map(issue => {
                    const dueDay = startOfDay(new Date(issue.dueDate!));
                    const colIndex = differenceInDays(dueDay, minDate);
                    const diffFromToday = differenceInDays(dueDay, today);

                    // Determine if "done" by column name (case-insensitive)
                    const isDone = issue.columnName.toLowerCase().includes("done");
                    const isOverdue = diffFromToday < 0 && !isDone;

                    const color = isDone
                        ? "bg-emerald-500"
                        : isOverdue
                            ? "bg-red-500"
                            : PRIORITY_COLORS[issue.priority || "MEDIUM"];

                    return (
                        <div key={issue.id} className="flex items-center border-b hover:bg-muted/30 transition-colors">
                            {/* Issue name */}
                            <div className="w-48 shrink-0 px-3 py-3">
                                <p className="text-sm font-medium truncate">{issue.title}</p>
                                <Badge variant="outline" className="text-[9px] px-1 h-4 font-normal mt-0.5">
                                    {issue.columnName}
                                </Badge>
                            </div>

                            {/* Timeline bar */}
                            <div className="flex flex-1 relative items-center h-12">
                                {dayHeaders.map((day, i) => {
                                    const isToday = differenceInDays(day, today) === 0;
                                    return (
                                        <div
                                            key={i}
                                            className={`flex-1 h-full border-l ${isToday ? "bg-primary/5" : ""}`}
                                        />
                                    );
                                })}

                                {/* Due date marker */}
                                <div
                                    className="absolute flex flex-col items-center"
                                    style={{
                                        left: `calc(${(colIndex / totalDays) * 100}% + ${100 / totalDays / 2}%)`,
                                        transform: "translateX(-50%)",
                                    }}
                                >
                                    <div className={`h-3 w-3 rounded-full ${color} ring-2 ring-background`} />
                                    <div className={`text-[9px] mt-0.5 font-medium whitespace-nowrap ${isOverdue ? "text-red-500" :
                                            isDone ? "text-emerald-600" :
                                                diffFromToday === 0 ? "text-orange-500" :
                                                    "text-muted-foreground"
                                        }`}>
                                        {isDone ? "Done" :
                                            isOverdue ? `${Math.abs(diffFromToday)}d late` :
                                                diffFromToday === 0 ? "Today" :
                                                    `${diffFromToday}d`}
                                    </div>
                                </div>
                            </div>
                        </div>
                    );
                })}

                {/* Legend */}
                <div className="flex items-center gap-4 mt-4 px-3 text-xs text-muted-foreground">
                    <div className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-emerald-500 inline-block" /> Done</div>
                    <div className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-red-500 inline-block" /> Overdue</div>
                    <div className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-orange-500 inline-block" /> Due today</div>
                    <div className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-blue-500 inline-block" /> Upcoming</div>
                </div>
            </div>
        </div>
    );
};

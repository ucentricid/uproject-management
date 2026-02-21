"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
    LayoutDashboard,
    FolderKanban,
    Users,
    Settings,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface SidebarNavProps {
    role?: string;
}

export const SidebarNav = ({ role }: SidebarNavProps) => {
    const pathname = usePathname();

    const routes = [
        {
            href: "/dashboard",
            label: "Dashboard",
            icon: LayoutDashboard,
            active: pathname === "/dashboard",
        },
        {
            href: "/dashboard/projects",
            label: "Projects",
            icon: FolderKanban,
            active: pathname.startsWith("/dashboard/projects"),
        },
        {
            href: "/dashboard/settings",
            label: "Settings",
            icon: Settings,
            active: pathname.startsWith("/dashboard/settings"),
        },
    ];

    if (role === "ADMIN") {
        routes.push({
            href: "/dashboard/users",
            label: "Users",
            icon: Users,
            active: pathname.startsWith("/dashboard/users"),
        });
    }

    return (
        <nav className="flex flex-col gap-2 flex-1">
            {routes.map((route) => (
                <Link key={route.href} href={route.href}>
                    <Button
                        variant={route.active ? "secondary" : "ghost"}
                        className={cn(
                            "w-full justify-start gap-2",
                            route.active && "bg-secondary text-primary font-medium"
                        )}
                    >
                        <route.icon className="h-4 w-4" />
                        {route.label}
                    </Button>
                </Link>
            ))}
        </nav>
    );
};

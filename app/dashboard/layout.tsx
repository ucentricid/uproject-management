import { auth } from "@/auth";
import { logout } from "@/actions/logout";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import {
    LogOut
} from "lucide-react";
import { SidebarNav } from "@/components/dashboard/sidebar-nav";
import { getDashboardSettings } from "@/actions/settings";

export default async function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const session = await auth();
    const dashboardSettings = await getDashboardSettings();

    return (
        <div className="flex h-screen overflow-hidden flex-col md:flex-row">
            <aside className="w-full md:w-64 border-r bg-muted/40 p-6 flex flex-col gap-6">
                <div className="flex items-center gap-2 font-bold text-xl">
                    <div className="h-8 w-8 min-w-8 bg-primary rounded-lg flex items-center justify-center text-primary-foreground text-sm">
                        {dashboardSettings.dashboardLogo}
                    </div>
                    <span className="truncate">{dashboardSettings.dashboardName}</span>
                </div>

                <SidebarNav role={session?.user?.role} />

                <div className="mt-auto border-t pt-4">
                    <div className="mb-4 text-sm text-muted-foreground truncate">
                        {session?.user?.email}
                    </div>
                    <form action={logout}>
                        <Button variant="outline" className="w-full justify-start gap-2">
                            <LogOut className="h-4 w-4" />
                            Sign Out
                        </Button>
                    </form>
                </div>
            </aside>
            <main className="flex-1 overflow-hidden">
                {children}
            </main>
        </div >
    );
}

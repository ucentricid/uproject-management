import { SettingsForm } from "@/components/settings/settings-form";
import { ProfileSettingsForm } from "@/components/settings/profile-settings-form";
import { SystemSettingsForm } from "@/components/settings/system-settings-form";
import { getSiteTitle, getDashboardSettings } from "@/actions/settings";
import { auth } from "@/auth";
import { redirect } from "next/navigation";

const SettingsPage = async () => {
    const session = await auth();

    if (!session?.user) {
        redirect("/auth/login");
    }

    const currentTitle = await getSiteTitle();
    const dashboardSettings = await getDashboardSettings();

    return (
        <div className="flex-1 space-y-4 p-8 pt-6">
            <div className="flex items-center justify-between space-y-2">
                <h2 className="text-3xl font-bold tracking-tight">Settings</h2>
            </div>

            <div className="mt-8 grid gap-8 md:grid-cols-2">
                <div className="space-y-8">
                    <ProfileSettingsForm initialName={session.user.name || ""} />
                    <SettingsForm />
                </div>

                <div className="space-y-8">
                    {session.user.role === "ADMIN" && (
                        <SystemSettingsForm
                            initialTitle={currentTitle}
                            initialDashboardName={dashboardSettings.dashboardName}
                            initialDashboardLogo={dashboardSettings.dashboardLogo}
                        />
                    )}
                </div>
            </div>
        </div>
    );
};

export default SettingsPage;

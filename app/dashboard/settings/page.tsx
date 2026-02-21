import { SettingsForm } from "@/components/settings/settings-form";
import { ProfileSettingsForm } from "@/components/settings/profile-settings-form";
import { SystemSettingsForm } from "@/components/settings/system-settings-form";
import { getSiteTitle, getDashboardSettings } from "@/actions/settings";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

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
            <p className="text-muted-foreground mb-8">
                Manage your profile, security preferences, and system configuration.
            </p>

            <Tabs defaultValue="profile" className="w-full">
                <TabsList className="flex flex-wrap w-full md:w-auto h-auto justify-start mb-8 gap-2 bg-transparent p-0">
                    <TabsTrigger value="profile" className="data-[state=active]:bg-muted px-4 py-2">Profile</TabsTrigger>
                    <TabsTrigger value="security" className="data-[state=active]:bg-muted px-4 py-2">Security</TabsTrigger>
                    {session.user.role === "ADMIN" && (
                        <TabsTrigger value="system" className="data-[state=active]:bg-muted px-4 py-2">System</TabsTrigger>
                    )}
                </TabsList>

                <TabsContent value="profile" className="space-y-4">
                    <ProfileSettingsForm initialName={session.user.name || ""} />
                </TabsContent>

                <TabsContent value="security" className="space-y-4">
                    <SettingsForm />
                </TabsContent>

                {session.user.role === "ADMIN" && (
                    <TabsContent value="system" className="space-y-4">
                        <SystemSettingsForm
                            initialTitle={currentTitle}
                            initialDashboardName={dashboardSettings.dashboardName}
                            initialDashboardLogo={dashboardSettings.dashboardLogo}
                        />
                    </TabsContent>
                )}
            </Tabs>
        </div>
    );
};

export default SettingsPage;

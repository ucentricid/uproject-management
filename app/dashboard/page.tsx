import { auth } from "@/auth";

const DashboardPage = async () => {
    const session = await auth();

    return (
        <div className="flex flex-col gap-4 p-8">
            <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
            <p className="text-muted-foreground">
                Welcome back, {session?.user?.name || "User"}!
            </p>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <div className="rounded-xl border bg-card text-card-foreground shadow">
                    <div className="p-6 flex flex-row items-center justify-between space-y-0 pb-2">
                        <h3 className="tracking-tight text-sm font-medium">Total Projects</h3>
                    </div>
                    <div className="p-6 pt-0">
                        <div className="text-2xl font-bold">--</div>
                        <p className="text-xs text-muted-foreground">Projects created</p>
                    </div>
                </div>
                {/* Add more stats here later */}
            </div>
        </div>
    );
}

export default DashboardPage;

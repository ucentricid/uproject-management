import { UserManagement } from "@/components/users/user-management";
import { auth } from "@/auth";
import { redirect } from "next/navigation";

const UsersPage = async () => {
    const session = await auth();

    if (session?.user?.role !== "ADMIN") {
        redirect("/dashboard");
    }

    return (
        <div className="flex-1 space-y-4 p-8 pt-6">
            <UserManagement />
        </div>
    );
};

export default UsersPage;

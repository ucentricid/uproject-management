"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AlertConfirmation } from "@/components/ui/alert-confirmation";
import { deleteProject } from "@/actions/projects";

interface DeleteProjectButtonProps {
    projectId: string;
}

export const DeleteProjectButton = ({ projectId }: DeleteProjectButtonProps) => {
    const [showAlert, setShowAlert] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isPending, startTransition] = useTransition();
    const router = useRouter();

    const handleConfirm = () => {
        setError(null);
        startTransition(() => {
            deleteProject(projectId)
                .then((result) => {
                    if (result.error) {
                        setError(result.error);
                        setShowAlert(false);
                    } else {
                        router.push("/dashboard/projects");
                    }
                })
                .catch((err) => {
                    console.error("deleteProject client error:", err);
                    setError("Terjadi kesalahan. Coba lagi.");
                    setShowAlert(false);
                });
        });
    };

    return (
        <>
            <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive"
                onClick={() => { setError(null); setShowAlert(true); }}
            >
                <Trash2 className="h-4 w-4" />
            </Button>

            {error && (
                <p className="text-xs text-destructive mt-1">{error}</p>
            )}

            <AlertConfirmation
                open={showAlert}
                onOpenChange={setShowAlert}
                title="Hapus Project?"
                description="Project hanya bisa dihapus jika belum ada issue di board dan belum ada diskusi. Tindakan ini tidak bisa dibatalkan."
                onConfirm={handleConfirm}
                isPending={isPending}
            />
        </>
    );
};

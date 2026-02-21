"use client";

import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { AlertTriangle } from "lucide-react";

interface AlertConfirmationProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    title: string;
    description?: string;
    onConfirm: () => void;
    isPending?: boolean;
    variant?: "destructive" | "default";
    confirmText?: string;
    cancelText?: string;
}

export const AlertConfirmation = ({
    open,
    onOpenChange,
    title,
    description,
    onConfirm,
    isPending,
    variant = "destructive",
    confirmText = "Continue",
    cancelText = "Cancel",
}: AlertConfirmationProps) => {
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader className="gap-2">
                    <div className="flex items-center gap-2 text-destructive">
                        <AlertTriangle className="h-5 w-5" />
                        <DialogTitle>{title}</DialogTitle>
                    </div>
                    {description && (
                        <DialogDescription>
                            {description}
                        </DialogDescription>
                    )}
                </DialogHeader>
                <DialogFooter className="mt-4">
                    <Button
                        variant="ghost"
                        onClick={() => onOpenChange(false)}
                        disabled={isPending}
                    >
                        {cancelText}
                    </Button>
                    <Button
                        variant={variant}
                        onClick={onConfirm}
                        disabled={isPending}
                    >
                        {isPending ? "Processing..." : confirmText}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

"use client";

import { CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Header } from "@/components/auth/header";
import { BackButton } from "@/components/auth/back-button";

interface CardWrapperProps {
    children: React.ReactNode;
    headerLabel: string;
    backButtonLabel: string;
    backButtonHref: string;
    showSocial?: boolean;
}

export const CardWrapper = ({
    children,
    headerLabel,
    backButtonLabel,
    backButtonHref,
}: CardWrapperProps) => {
    return (
        <div className="w-full max-w-md space-y-1">
            <CardHeader className="px-0 pb-2">
                <Header label={headerLabel} />
            </CardHeader>
            <CardContent className="px-0">
                {children}
            </CardContent>
            {backButtonLabel && (
                <CardFooter className="px-0 flex justify-center">
                    <BackButton
                        label={backButtonLabel}
                        href={backButtonHref}
                    />
                </CardFooter>
            )}
        </div>
    );
};

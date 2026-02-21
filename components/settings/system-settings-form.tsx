"use client";

import * as z from "zod";
import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Input } from "@/components/ui/input";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { FormError } from "@/components/form-error";
import { FormSuccess } from "@/components/form-success";
import { Card, CardHeader, CardContent, CardTitle, CardDescription } from "@/components/ui/card";
import { updateSiteTitle, updateDashboardSettings } from "@/actions/settings";
import { useRouter } from "next/navigation";

const SystemSettingsSchema = z.object({
    siteTitle: z.string().min(1, {
        message: "Site title is required",
    }),
    dashboardName: z.string().min(1, {
        message: "Dashboard name is required",
    }),
    dashboardLogo: z.string().min(1, {
        message: "Dashboard logo is required",
    }).max(4, {
        message: "Logo text should be short (1-4 characters)",
    }),
});

interface SystemSettingsFormProps {
    initialTitle: string;
    initialDashboardName: string;
    initialDashboardLogo: string;
}

export const SystemSettingsForm = ({
    initialTitle,
    initialDashboardName,
    initialDashboardLogo
}: SystemSettingsFormProps) => {
    const [error, setError] = useState<string | undefined>("");
    const [success, setSuccess] = useState<string | undefined>("");
    const [isPending, startTransition] = useTransition();
    const router = useRouter();

    const form = useForm<z.infer<typeof SystemSettingsSchema>>({
        resolver: zodResolver(SystemSettingsSchema),
        defaultValues: {
            siteTitle: initialTitle,
            dashboardName: initialDashboardName,
            dashboardLogo: initialDashboardLogo,
        },
    });

    const onSubmit = (values: z.infer<typeof SystemSettingsSchema>) => {
        setError("");
        setSuccess("");

        startTransition(() => {
            Promise.all([
                updateSiteTitle(values.siteTitle),
                updateDashboardSettings(values.dashboardName, values.dashboardLogo)
            ])
                .then(([titleData, dashboardData]) => {
                    if (titleData?.error || dashboardData?.error) {
                        setError(titleData?.error || dashboardData?.error);
                    } else if (titleData?.success && dashboardData?.success) {
                        setSuccess("All system settings updated!");
                        router.refresh();
                    }
                })
                .catch(() => setError("Something went wrong!"));
        });
    };

    return (
        <Card className="w-full">
            <CardHeader>
                <CardTitle>System Settings</CardTitle>
                <CardDescription>Global configuration for the application. Administrator access only.</CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                        <div className="space-y-4">
                            <FormField
                                control={form.control}
                                name="siteTitle"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Global Site Title (Browser Tab)</FormLabel>
                                        <FormControl>
                                            <Input
                                                {...field}
                                                disabled={isPending}
                                                placeholder="My Project Manager"
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <FormField
                                    control={form.control}
                                    name="dashboardName"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Dashboard App Name</FormLabel>
                                            <FormControl>
                                                <Input
                                                    {...field}
                                                    disabled={isPending}
                                                    placeholder="ProjectManager"
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="dashboardLogo"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Dashboard Logo Text</FormLabel>
                                            <FormControl>
                                                <Input
                                                    {...field}
                                                    disabled={isPending}
                                                    placeholder="P"
                                                    maxLength={4}
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>
                        </div>
                        <FormError message={error} />
                        <FormSuccess message={success} />
                        <Button
                            disabled={isPending}
                            type="submit"
                            variant="default"
                            className="w-full"
                        >
                            Update System Settings
                        </Button>
                    </form>
                </Form>
            </CardContent>
        </Card>
    );
};

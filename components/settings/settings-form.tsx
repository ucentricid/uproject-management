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
import { updatePassword } from "@/actions/settings";

const SettingsSchema = z.object({
    password: z.string().min(6, {
        message: "Minimum of 6 characters required",
    }),
    confirmPassword: z.string().min(6, {
        message: "Minimum of 6 characters required",
    }),
}).refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
});

export const SettingsForm = () => {
    const [error, setError] = useState<string | undefined>("");
    const [success, setSuccess] = useState<string | undefined>("");
    const [isPending, startTransition] = useTransition();

    const form = useForm<z.infer<typeof SettingsSchema>>({
        resolver: zodResolver(SettingsSchema),
        defaultValues: {
            password: "",
            confirmPassword: "",
        },
    });

    const onSubmit = (values: z.infer<typeof SettingsSchema>) => {
        setError("");
        setSuccess("");

        startTransition(() => {
            updatePassword(values.password)
                .then((data) => {
                    if (data.error) {
                        setError(data.error);
                    }
                    if (data.success) {
                        setSuccess(data.success);
                        form.reset();
                    }
                })
                .catch(() => setError("Something went wrong!"));
        });
    };

    return (
        <Card className="w-full max-w-xl">
            <CardHeader>
                <CardTitle>Change Password</CardTitle>
                <CardDescription>Update the password you use to log in to the system.</CardDescription>
            </CardHeader>
            <CardContent>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                        <div className="space-y-4">
                            <FormField
                                control={form.control}
                                name="password"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>New Password</FormLabel>
                                        <FormControl>
                                            <Input
                                                {...field}
                                                disabled={isPending}
                                                placeholder="••••••"
                                                type="password"
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="confirmPassword"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Confirm Password</FormLabel>
                                        <FormControl>
                                            <Input
                                                {...field}
                                                disabled={isPending}
                                                placeholder="••••••"
                                                type="password"
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>
                        <FormError message={error} />
                        <FormSuccess message={success} />
                        <Button
                            disabled={isPending}
                            type="submit"
                        >
                            Update Password
                        </Button>
                    </form>
                </Form>
            </CardContent>
        </Card>
    );
};

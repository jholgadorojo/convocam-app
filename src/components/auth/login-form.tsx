"use client";

import { type FormEvent, useState } from "react";
import Link from "next/link";
import { CircleAlert, Eye, EyeOff } from "lucide-react";

import { authClient } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useRouter, useSearchParams } from "next/navigation";
import { getSafeReturnTo } from "@/shared/infrastructure/security/safe-return-to";

export function LoginForm() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const router = useRouter();
    const searchParams = useSearchParams();

    const [showPassword, setShowPassword] = useState(false);

    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");
    const [isLoading, setIsLoading] = useState(false);

    async function handleSubmit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();

        setError("");
        setSuccess("");
        setIsLoading(true);

        const { data, error } = await authClient.signIn.email({
            email,
            password,
        });

        setIsLoading(false);

        if (error) {
            setError(
                error.message ?? "No se ha podido iniciar sesión.",
            );
            return;
        }

        if (data) {
            const returnTo = getSafeReturnTo(
                searchParams.get("returnTo"),
            );

            router.replace(returnTo);
            router.refresh();
        }
    }

    return (
        <form onSubmit={handleSubmit} className="flex flex-col gap-[18px]">
            {/* Email */}
            <div className="flex flex-col gap-1.5">
                <Label
                    htmlFor="email"
                    className="text-[13.5px] font-semibold text-[#131A2C]"
                >
                    Correo electrónico
                </Label>

                <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    placeholder="nombre@ejemplo.es"
                    className="h-11 rounded-lg border-[#D5DAE3] px-3 text-sm"
                    required
                />
            </div>

            {/* Contraseña */}
            <div className="flex flex-col gap-1.5">
                <div className="flex items-center justify-between">
                    <Label
                        htmlFor="password"
                        className="text-[13.5px] font-semibold text-[#131A2C]"
                    >
                        Contraseña
                    </Label>

                    <Link
                        href="/forgot-password"
                        className="text-[13.5px] font-semibold text-[#3B45B5] hover:underline"
                    >
                        He olvidado la contraseña
                    </Link>
                </div>

                <div className="relative">
                    <Input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        value={password}
                        onChange={(event) => setPassword(event.target.value)}
                        className="h-11 rounded-lg border-[#D5DAE3] px-3 pr-11 text-sm"
                        required
                    />

                    <button
                        type="button"
                        onClick={() => setShowPassword((value) => !value)}
                        className="absolute right-3 top-1/2 flex -translate-y-1/2 items-center justify-center text-[#4E5870]"
                        aria-label={
                            showPassword
                                ? "Ocultar contraseña"
                                : "Mostrar contraseña"
                        }
                    >
                        {showPassword ? (
                            <EyeOff size={16} />
                        ) : (
                            <Eye size={16} />
                        )}
                    </button>
                </div>
            </div>

            {/* Error */}
            {error && (
                <p className="flex items-center gap-1.5 text-[13px] text-[#B3212F]">
                    <CircleAlert size={14} />
                    {error}
                </p>
            )}

            {/* Éxito */}
            {success && (
                <p className="rounded-lg bg-green-50 px-3 py-2 text-[13px] text-green-700">
                    {success}
                </p>
            )}

            <Button
                type="submit"
                disabled={isLoading}
                className="mt-1.5 h-12 w-full rounded-[10px] bg-[#4F5BD5] text-[15px] font-semibold text-white shadow-sm hover:bg-[#3B45B5]"
            >
                {isLoading ? "Iniciando sesión..." : "Iniciar sesión"}
            </Button>
        </form>
    );
}
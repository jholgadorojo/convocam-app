"use client";

import { type FormEvent, useState } from "react";
import { CircleAlert, CircleCheck, Eye, EyeOff } from "lucide-react";

import { authClient } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function RegisterForm() {
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [passwordConfirmation, setPasswordConfirmation] = useState("");

    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmation, setShowConfirmation] = useState(false);

    const [confirmationError, setConfirmationError] = useState("");
    const [generalError, setGeneralError] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [success, setSuccess] = useState("");

    async function handleSubmit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();

        setConfirmationError("");
        setGeneralError("");
        setSuccess("");

        if (password !== passwordConfirmation) {
            setConfirmationError("Las contraseñas no coinciden.");
            return;
        }

        const passwordIsValid =
            password.length >= 8 &&
            /[A-Za-z]/.test(password) &&
            /\d/.test(password);

        if (!passwordIsValid) {
            setGeneralError(
                "La contraseña debe tener al menos 8 caracteres, una letra y un número.",
            );
            return;
        }

        setIsLoading(true);

        try {
            const { data, error } = await authClient.signUp.email({
                name,
                email,
                password,
            });

            if (error) {
                setGeneralError(
                    error.message ?? "No se ha podido crear la cuenta.",
                );
                return;
            }

            if (data) {
                setSuccess("La cuenta se ha creado correctamente.");
                setName("");
                setEmail("");
                setPassword("");
                setPasswordConfirmation("");
            }
        } catch {
            setGeneralError("No se ha podido conectar con el servidor.");
        } finally {
            setIsLoading(false);
        }
    }

    return (
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            {/* Nombre */}
            <div className="flex flex-col gap-1.5">
                <Label
                    htmlFor="name"
                    className="text-[13.5px] font-semibold text-[#131A2C]"
                >
                    Nombre
                </Label>

                <Input
                    id="name"
                    value={name}
                    onChange={(event) => setName(event.target.value)}
                    placeholder="José"
                    className="h-11 rounded-lg border-[#D5DAE3] px-3 text-sm"
                    required
                />
            </div>

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
                    placeholder="jose.puig@ejemplo.es"
                    className="h-11 rounded-lg border-[#D5DAE3] px-3 text-sm"
                    required
                />
            </div>

            {/* Contraseña */}
            <div className="flex flex-col gap-1.5">
                <Label
                    htmlFor="password"
                    className="text-[13.5px] font-semibold text-[#131A2C]"
                >
                    Contraseña
                </Label>

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
                            showPassword ? "Ocultar contraseña" : "Mostrar contraseña"
                        }
                    >
                        {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                </div>

                <p className="text-[12.5px] text-[#7C859B]">
                    Mínimo 8 caracteres, con al menos una letra y un número.
                </p>
            </div>

            {/* Confirmar contraseña */}
            <div className="flex flex-col gap-1.5">
                <Label
                    htmlFor="passwordConfirmation"
                    className="text-[13.5px] font-semibold text-[#131A2C]"
                >
                    Confirmar contraseña
                </Label>

                <div className="relative">
                    <Input
                        id="passwordConfirmation"
                        type={showConfirmation ? "text" : "password"}
                        value={passwordConfirmation}
                        onChange={(event) =>
                            setPasswordConfirmation(event.target.value)
                        }
                        className={
                            confirmationError
                                ? "h-11 rounded-lg border-[#D93544] px-3 pr-11 text-sm ring-3 ring-[#D93544]/15"
                                : "h-11 rounded-lg border-[#D5DAE3] px-3 pr-11 text-sm"
                        }
                        required
                    />

                    <button
                        type="button"
                        onClick={() => setShowConfirmation((value) => !value)}
                        className="absolute right-3 top-1/2 flex -translate-y-1/2 items-center justify-center text-[#4E5870]"
                        aria-label={
                            showConfirmation ? "Ocultar contraseña" : "Mostrar contraseña"
                        }
                    >
                        {showConfirmation ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                </div>

                {confirmationError && (
                    <p className="flex items-center gap-1.5 text-[13px] text-[#B3212F]">
                        <CircleAlert size={14} />
                        {confirmationError}
                    </p>
                )}
            </div>

            {/* Error general */}
            {generalError && (
                <p className="flex items-center gap-1.5 text-[13px] text-[#B3212F]">
                    <CircleAlert size={14} />
                    {generalError}
                </p>
            )}

            {/* Mensaje de éxito */}
            {success && (
                <p
                    role="status"
                    className="flex items-center gap-1.5 text-[13px] text-[#1E7B4A]"
                >
                    <CircleCheck size={14} />
                    {success}
                </p>
            )}

            {/* Botón */}
            <Button
                type="submit"
                disabled={isLoading}
                className="mt-1.5 h-12 w-full rounded-[10px] bg-[#4F5BD5] text-[15px] font-semibold text-white shadow-sm hover:bg-[#3B45B5]"
            >
                {isLoading ? "Creando cuenta..." : "Crear cuenta"}
            </Button>

            {/* Condiciones */}
            <p className="text-center text-[12.5px] text-[#7C859B]">
                Al crear la cuenta aceptas las{" "}
                <a href="#" className="text-[#3B45B5] hover:underline">
                    condiciones de uso
                </a>{" "}
                y la{" "}
                <a href="#" className="text-[#3B45B5] hover:underline">
                    política de privacidad
                </a>
                .
            </p>
        </form>
    );
}
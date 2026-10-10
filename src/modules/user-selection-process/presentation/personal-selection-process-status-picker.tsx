"use client";

import {
    BadgeCheck,
    CheckCircle2,
    CircleX,
    Clock3,
    FileCheck2,
    Flag,
    Heart,
    Send,
    X,
} from "lucide-react";

import { useState } from "react";

import { PersonalSelectionProcessStatus } from "../domain/personal-selection-process-status";

type PersonalSelectionProcessStatusPickerProps = {
    selectionProcessId: number;

    currentStatus: PersonalSelectionProcessStatus;

    action: (
        formData: FormData,
    ) => Promise<void>;
    embedded?: boolean;
};

const STATUS_OPTIONS = [
    {
        value:
            PersonalSelectionProcessStatus.INTERESTED,
        label: "Me interesa",
        description:
            "Quiero seguir esta convocatoria.",
        icon: Heart,
    },

    {
        value:
            PersonalSelectionProcessStatus.PREPARING_APPLICATION,
        label: "Preparando solicitud",
        description:
            "Estoy preparando la documentación.",
        icon: FileCheck2,
    },

    {
        value:
            PersonalSelectionProcessStatus.APPLICATION_SUBMITTED,
        label: "Solicitud presentada",
        description:
            "Ya he presentado la solicitud.",
        icon: Send,
    },

    {
        value:
            PersonalSelectionProcessStatus.ADMITTED,
        label: "Admitido",
        description:
            "He sido admitido en el proceso.",
        icon: BadgeCheck,
    },

    {
        value:
            PersonalSelectionProcessStatus.EXCLUDED,
        label: "Excluido",
        description:
            "He quedado excluido del proceso.",
        icon: CircleX,
    },

    {
        value:
            PersonalSelectionProcessStatus.EXAM_PENDING,
        label: "Examen pendiente",
        description:
            "Estoy pendiente de realizar el examen.",
        icon: Clock3,
    },

    {
        value:
            PersonalSelectionProcessStatus.EXAM_COMPLETED,
        label: "Examen realizado",
        description:
            "Ya he realizado el examen.",
        icon: CheckCircle2,
    },

    {
        value:
            PersonalSelectionProcessStatus.COMPLETED,
        label: "Finalizado",
        description:
            "He terminado el seguimiento del proceso.",
        icon: Flag,
    },
] as const;

export function PersonalSelectionProcessStatusPicker({
    selectionProcessId,
    currentStatus,
    action,
    embedded = false,
}: PersonalSelectionProcessStatusPickerProps) {
    const [isOpen, setIsOpen] =
        useState(false);

    const currentOption =
        STATUS_OPTIONS.find(
            (option) =>
                option.value ===
                currentStatus,
        );

    const CurrentIcon =
        currentOption?.icon ??
        Heart;

    return (
        <>
            {/* ======================================
          ESTADO ACTUAL
      ====================================== */}
            {embedded ? (
                <div className="flex flex-col gap-3">
                    {/* Estado actual */}
                    <div className="flex min-w-0 items-center gap-2.5">
                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#EEF0FC] text-[#4F5BD5]">
                            <CurrentIcon size={17} />
                        </span>

                        <span className="min-w-0 text-[15px] font-semibold leading-snug text-[#131A2C]">
                            {currentOption?.label ??
                                "Estado personal"}
                        </span>
                    </div>

                    {/* Cambiar estado */}
                    <button
                        type="button"
                        onClick={() => {
                            setIsOpen(true);
                        }}
                        className="inline-flex w-full items-center justify-center rounded-lg border border-[#D5DAE3] bg-white px-3 py-2 text-sm font-semibold text-[#3B45B5] hover:bg-[#F4F6F9]"
                    >
                        Cambiar estado
                    </button>
                </div>
            ) : (
                <div className="rounded-lg border border-[#E3E7EE] bg-[#FAFBFC] px-3.5 py-3">
                    <div className="flex items-center justify-between gap-3">
                        <div className="min-w-0">
                            <p className="text-[10.5px] font-semibold uppercase tracking-[0.05em] text-[#7C859B]">
                                Mi estado
                            </p>

                            <div className="mt-1.5 flex items-center gap-2">
                                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#EEF0FC] text-[#4F5BD5]">
                                    <CurrentIcon size={15} />
                                </span>

                                <span className="truncate text-sm font-semibold text-[#131A2C]">
                                    {currentOption?.label ??
                                        "Estado personal"}
                                </span>
                            </div>
                        </div>

                        <button
                            type="button"
                            onClick={() =>
                                setIsOpen(true)
                            }
                            className="shrink-0 rounded-lg border border-[#D5DAE3] bg-white px-3 py-2 text-xs font-semibold text-[#3B45B5] hover:bg-[#F4F6F9]"
                        >
                            Cambiar estado
                        </button>
                    </div>
                </div>
            )}

            {/* ======================================
          MODAL
      ====================================== */}
            {isOpen && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
                    onMouseDown={() =>
                        setIsOpen(false)
                    }
                >
                    <div
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="personal-status-title"
                        onMouseDown={(
                            event,
                        ) =>
                            event.stopPropagation()
                        }
                        className="w-full max-w-[620px] overflow-hidden rounded-2xl border border-[#E3E7EE] bg-white shadow-xl"
                    >
                        {/* Cabecera */}
                        <div className="flex items-start justify-between gap-4 border-b border-[#EEF1F5] px-5 py-4">
                            <div>
                                <h2
                                    id="personal-status-title"
                                    className="text-lg font-semibold text-[#131A2C]"
                                >
                                    Cambiar mi estado
                                </h2>

                                <p className="mt-1 text-sm text-[#69738A]">
                                    Indica en qué punto te
                                    encuentras dentro de esta
                                    convocatoria.
                                </p>
                            </div>

                            <button
                                type="button"
                                onClick={() =>
                                    setIsOpen(false)
                                }
                                aria-label="Cerrar"
                                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-[#69738A] hover:bg-[#F4F6F9] hover:text-[#131A2C]"
                            >
                                <X size={18} />
                            </button>
                        </div>

                        {/* Estados */}
                        <div className="grid gap-2 p-4 sm:grid-cols-2">
                            {STATUS_OPTIONS.map(
                                (option) => {
                                    const Icon =
                                        option.icon;

                                    const isCurrent =
                                        option.value ===
                                        currentStatus;

                                    return (
                                        <form
                                            key={
                                                option.value
                                            }
                                            action={
                                                action
                                            }
                                            onSubmit={() => {
                                                setIsOpen(false);
                                            }}
                                        >
                                            <input
                                                type="hidden"
                                                name="selectionProcessId"
                                                value={
                                                    selectionProcessId
                                                }
                                            />

                                            <input
                                                type="hidden"
                                                name="personalStatus"
                                                value={
                                                    option.value
                                                }
                                            />

                                            <button
                                                type="submit"
                                                disabled={
                                                    isCurrent
                                                }
                                                className={
                                                    isCurrent
                                                        ? "flex w-full items-start gap-3 rounded-xl border border-[#BFC5F4] bg-[#EEF0FC] p-3.5 text-left"
                                                        : "flex w-full items-start gap-3 rounded-xl border border-[#E3E7EE] bg-white p-3.5 text-left transition hover:border-[#BFC5F4] hover:bg-[#F7F8FF]"
                                                }
                                            >
                                                <span
                                                    className={
                                                        isCurrent
                                                            ? "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#4F5BD5] text-white"
                                                            : "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#F1F3F7] text-[#4E5870]"
                                                    }
                                                >
                                                    <Icon
                                                        size={17}
                                                    />
                                                </span>

                                                <span className="min-w-0">
                                                    <span className="flex items-center gap-2">
                                                        <span className="text-sm font-semibold text-[#131A2C]">
                                                            {
                                                                option.label
                                                            }
                                                        </span>

                                                        {isCurrent && (
                                                            <span className="rounded-full bg-white px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.04em] text-[#4F5BD5]">
                                                                Actual
                                                            </span>
                                                        )}
                                                    </span>

                                                    <span className="mt-1 block text-xs leading-relaxed text-[#69738A]">
                                                        {
                                                            option.description
                                                        }
                                                    </span>
                                                </span>
                                            </button>
                                        </form>
                                    );
                                },
                            )}
                        </div>

                        {/* Pie */}
                        <div className="flex justify-end border-t border-[#EEF1F5] px-5 py-3">
                            <button
                                type="button"
                                onClick={() =>
                                    setIsOpen(false)
                                }
                                className="rounded-lg border border-[#D5DAE3] bg-white px-4 py-2 text-sm font-semibold text-[#131A2C] hover:bg-[#F4F6F9]"
                            >
                                Cancelar
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
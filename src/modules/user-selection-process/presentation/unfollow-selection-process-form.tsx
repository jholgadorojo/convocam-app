"use client";

import { useState } from "react";
import {
  AlertTriangle,
  X,
} from "lucide-react";

type UnfollowSelectionProcessFormProps = {
  selectionProcessId: number;

  action: (
    formData: FormData,
  ) => Promise<void>;
};

export function UnfollowSelectionProcessForm({
  selectionProcessId,
  action,
}: UnfollowSelectionProcessFormProps) {
  const [isOpen, setIsOpen] =
    useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="text-sm font-medium text-[#7C859B] hover:text-[#C24141] hover:underline"
      >
        Dejar de seguir
      </button>

      {isOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-[#0E1A33]/40 px-4 backdrop-blur-[2px]"
          role="presentation"
          onMouseDown={() =>
            setIsOpen(false)
          }
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="unfollow-dialog-title"
            aria-describedby="unfollow-dialog-description"
            className="w-full max-w-[440px] rounded-2xl border border-[#E3E7EE] bg-white shadow-2xl"
            onMouseDown={(event) =>
              event.stopPropagation()
            }
          >
            <div className="flex items-start justify-between gap-4 p-6">
              <div className="flex gap-4">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#FDECEC] text-[#C24141]">
                  <AlertTriangle
                    size={21}
                    strokeWidth={1.8}
                  />
                </div>

                <div>
                  <h2
                    id="unfollow-dialog-title"
                    className="text-[17px] font-semibold text-[#131A2C]"
                  >
                    ¿Dejar de seguir esta convocatoria?
                  </h2>

                  <p
                    id="unfollow-dialog-description"
                    className="mt-2 text-sm leading-relaxed text-[#69738A]"
                  >
                    Se eliminará de Mis
                    convocatorias y también
                    perderás el estado personal
                    que tengas asociado.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() =>
                  setIsOpen(false)
                }
                aria-label="Cerrar"
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-[#7C859B] hover:bg-[#F1F3F7] hover:text-[#131A2C]"
              >
                <X size={18} />
              </button>
            </div>

            <div className="border-t border-[#EEF1F5] bg-[#FAFBFC] px-6 py-4">
              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() =>
                    setIsOpen(false)
                  }
                  className="h-10 rounded-lg border border-[#D5DAE3] bg-white px-4 text-sm font-semibold text-[#4E5870] hover:bg-[#F4F6F9]"
                >
                  Cancelar
                </button>

                <form action={action}>
                  <input
                    type="hidden"
                    name="selectionProcessId"
                    value={
                      selectionProcessId
                    }
                  />

                  <button
                    type="submit"
                    className="h-10 rounded-lg bg-[#C24141] px-4 text-sm font-semibold text-white hover:bg-[#A73535]"
                  >
                    Sí, dejar de seguir
                  </button>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
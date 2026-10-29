import type { UserSelectionProcessDto } from
  "@/modules/user-selection-process/application/user-selection-process-dto";
import { PersonalSelectionProcessStatusPicker } from "@/modules/user-selection-process/presentation/personal-selection-process-status-picker";
import { UnfollowSelectionProcessForm } from "@/modules/user-selection-process/presentation/unfollow-selection-process-form";
import {
  changePersonalStatusAction,
  followSelectionProcessAction,
  unfollowSelectionProcessAction,
} from "./actions";
import { formatDateTime } from "./detail-presentation";

/**
 * Seguimiento personal: estado personal y dejar de seguir si
 * ya se sigue la convocatoria; si no, el botón para seguirla.
 */
export function PersonalTrackingCard({
  selectionProcessId,
  userSelectionProcess,
  isAuthenticated,
  detailHref,
}: {
  selectionProcessId: number;
  userSelectionProcess: UserSelectionProcessDto | null;
  isAuthenticated: boolean;
  /** URL de este detalle, para volver tras seguir (o tras el login). */
  detailHref: string;
}) {
  return (
    <section className="rounded-xl border border-[#D8DCF8] bg-white p-5 shadow-sm">
      <p className="text-[11px] font-semibold uppercase tracking-[0.06em] text-[#7C859B]">
        Seguimiento personal
      </p>
      {userSelectionProcess ? (
        <>
          <div className="mt-3">
            <PersonalSelectionProcessStatusPicker
              selectionProcessId={selectionProcessId}
              currentStatus={userSelectionProcess.personalStatus}
              action={changePersonalStatusAction}
              embedded
            />
          </div>
          <div className="mt-4 border-t border-[#EEF1F5] pt-3">
            <p className="text-xs font-medium text-[#69738A]">
              Último cambio:{" "}
              <span className="font-semibold text-[#4E5870]">
                {formatDateTime(userSelectionProcess.personalStatusUpdatedAt)}
              </span>
            </p>
            <p className="mt-1.5 text-xs leading-relaxed text-[#7C859B]">
              Tu estado personal. No modifica el estado oficial de la
              convocatoria.
            </p>
            <div className="mt-3">
              <UnfollowSelectionProcessForm
                selectionProcessId={selectionProcessId}
                action={unfollowSelectionProcessAction}
              />
            </div>
          </div>
        </>
      ) : (
        <>
          <p className="mt-3 text-sm leading-relaxed text-[#4E5870]">
            Sigue esta convocatoria para indicar en qué punto del proceso te
            encuentras.
          </p>
          <form action={followSelectionProcessAction} className="mt-4">
            <input type="hidden" name="selectionProcessId" value={selectionProcessId} />
            <input type="hidden" name="returnTo" value={detailHref} />
            <button
              type="submit"
              className="inline-flex w-full items-center justify-center rounded-lg bg-[#4F5BD5] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#3B45B5]"
            >
              Seguir convocatoria
            </button>
          </form>
          {!isAuthenticated && (
            <p className="mt-2 text-center text-xs leading-relaxed text-[#7C859B]">
              Necesitarás iniciar sesión para guardar tu seguimiento.
            </p>
          )}
        </>
      )}
    </section>
  );
}


export default function ForMeLoading() {
  return (
    <div
      role="status"
      aria-label="Cargando convocatorias para mí"
      className="flex min-h-screen bg-[#F4F6F9]"
    >
      <span className="sr-only">
        Estamos buscando convocatorias que coincidan
        con tus preferencias.
      </span>

      <div
        aria-hidden="true"
        className="flex min-h-screen w-full motion-safe:animate-pulse"
      >
        {/* Menú lateral provisional */}
        <aside className="sticky top-0 hidden h-screen w-[264px] shrink-0 flex-col bg-[#0E1A33] px-[14px] pb-5 pt-[18px] lg:flex">
          <div className="flex items-center gap-3 px-2 pb-7">
            <div className="h-[30px] w-[30px] rounded-lg bg-[#4F5BD5]/60" />
            <div className="h-5 w-28 rounded bg-[#34415C]" />
          </div>

          <div className="flex flex-col gap-3 px-3">
            <div className="h-5 w-36 rounded bg-[#34415C]" />
            <div className="h-5 w-40 rounded bg-[#34415C]" />
            <div className="h-10 rounded-lg bg-[#1B2A4D]" />
            <div className="h-5 w-36 rounded bg-[#34415C]" />
          </div>
        </aside>

        <div className="flex min-w-0 flex-1 flex-col">
          {/* Cabecera */}
          <div className="flex h-[72px] items-center border-b border-[#E3E7EE] bg-white px-6">
            <div className="h-5 w-28 rounded bg-[#E3E7EE]" />
          </div>

          <main className="flex-1 px-4 py-8 lg:px-6">
            {/* Título y descripción */}
            <div className="flex flex-wrap justify-between gap-4">
              <div>
                <div className="h-8 w-36 rounded bg-[#DDE2EB]" />
                <div className="mt-3 h-4 w-72 max-w-full rounded bg-[#E3E7EE]" />
              </div>

              <div className="h-10 w-48 rounded-lg bg-[#E3E7EE]" />
            </div>

            {/* Contador de resultados */}
            <div className="mt-8">
              <div className="h-5 w-48 rounded bg-[#DDE2EB]" />
              <div className="mt-2 h-4 w-32 rounded bg-[#E3E7EE]" />
            </div>

            {/* Tarjetas provisionales */}
            <div className="mt-5 grid min-w-0 items-start gap-3 min-[1180px]:grid-cols-2">
              {Array.from({ length: 6 }, (_, index) => (
                <article
                  key={index}
                  className="rounded-xl border border-[#E3E7EE] bg-white p-4 shadow-sm"
                >
                  <div className="flex gap-2">
                    <div className="h-7 w-28 rounded-full bg-[#E9ECF4]" />
                    <div className="h-7 w-32 rounded-full bg-[#E9ECF4]" />
                  </div>

                  <div className="mt-5 h-5 w-4/5 rounded bg-[#DDE2EB]" />
                  <div className="mt-2 h-5 w-3/5 rounded bg-[#E9ECF4]" />

                  <div className="mt-4 h-4 w-2/5 rounded bg-[#E9ECF4]" />

                  <div className="mt-5 rounded-lg bg-[#F7F8FA] p-4">
                    <div className="h-3 w-28 rounded bg-[#E3E7EE]" />
                    <div className="mt-3 h-5 w-3/4 rounded bg-[#E3E7EE]" />
                    <div className="mt-2 h-3 w-1/2 rounded bg-[#E3E7EE]" />
                  </div>

                  <div className="mt-5 h-3 w-40 rounded bg-[#E3E7EE]" />

                  <div className="mt-3 flex gap-2">
                    <div className="h-6 w-28 rounded-full bg-[#E9ECF4]" />
                    <div className="h-6 w-32 rounded-full bg-[#E9ECF4]" />
                  </div>

                  <div className="mt-5 flex justify-end gap-2 border-t border-[#EEF1F5] pt-4">
                    <div className="h-9 w-28 rounded-lg bg-[#E9ECF4]" />
                    <div className="h-9 w-36 rounded-lg bg-[#DDE2EB]" />
                  </div>
                </article>
              ))}
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}

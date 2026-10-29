/** Cabecera del dashboard: saludo y descripción de la vista. */
export function DashboardHeading({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <header>
      <h1 className="text-[28px] font-semibold tracking-tight text-[#131A2C]">
        {title}
      </h1>
      <p className="mt-1.5 text-[15px] text-[#4E5870]">
        {description}
      </p>
    </header>
  );
}

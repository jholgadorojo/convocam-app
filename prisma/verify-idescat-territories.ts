import "dotenv/config";
import { prisma } from "../src/shared/infrastructure/database/prisma";

async function main() {
  const [provinces, counties, municipalities] = await Promise.all([
    prisma.province.count(),
    prisma.county.count(),
    prisma.municipality.count(),
  ]);

  console.log("Provincias:", provinces);
  console.log("Comarcas y Aran:", counties);
  console.log("Municipios:", municipalities);

  const cardedeu = await prisma.municipality.findUnique({
    where: { code: "080462" },
    include: {
      county: true,
      province: true,
    },
  });

  console.log("Municipio:", cardedeu?.name);
  console.log("Comarca:", cardedeu?.county.name);
  console.log("Provincia:", cardedeu?.province.name);

  if (
    provinces !== 4 ||
    counties !== 43 ||
    municipalities !== 947 ||
    cardedeu?.name !== "Cardedeu" ||
    cardedeu.county.name !== "Vallès Oriental" ||
    cardedeu.province.name !== "Barcelona"
  ) {
    throw new Error("La verificación territorial ha fallado");
  }

  console.log("Verificación territorial correcta");
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
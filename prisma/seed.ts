import { PrismaClient } from "@prisma/client";
import { MOCK_JOBS } from "../src/lib/mockData";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding database...");

  await prisma.job.deleteMany();

  const result = await prisma.job.createMany({
    data: MOCK_JOBS.map((j) => ({
      ...j,
      lat: j.lat ?? undefined,
      lng: j.lng ?? undefined,
      salaryMin: j.salaryMin ?? undefined,
      salaryMax: j.salaryMax ?? undefined,
      postedAt: new Date(j.postedAt),
    })),
  });

  console.log(`✅ Seeded ${result.count} jobs`);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const [totalJobs, remoteJobs, today] = await Promise.all([
    prisma.job.count({ where: { isActive: true } }),
    prisma.job.count({ where: { isActive: true, jobType: "Remote" } }),
    prisma.job.count({
      where: {
        isActive: true,
        postedAt: { gte: new Date(new Date().setHours(0, 0, 0, 0)) },
      },
    }),
  ]);

  const [companies, cities] = await Promise.all([
    prisma.job.groupBy({ by: ["company"], where: { isActive: true }, _count: true }),
    prisma.job.groupBy({ by: ["city"], where: { isActive: true }, _count: true }),
  ]);

  return NextResponse.json({
    totalJobs,
    totalCompanies: companies.length,
    totalCities: cities.length,
    remoteJobs,
    todayJobs: today,
  });
}

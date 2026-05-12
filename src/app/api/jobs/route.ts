import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const search = searchParams.get("search") || "";
  const minExp = parseInt(searchParams.get("minExp") || "0");
  const maxExp = parseInt(searchParams.get("maxExp") || "10");
  const locations = searchParams.getAll("location");
  const companyTypes = searchParams.getAll("companyType");
  const jobTypes = searchParams.getAll("jobType");
  const industries = searchParams.getAll("industry");
  const postedWithin = searchParams.get("postedWithin") || "";
  const salaryRange = searchParams.get("salaryRange") || "";
  const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
  const limit = Math.min(20, parseInt(searchParams.get("limit") || "12"));
  const sort = searchParams.get("sort") || "newest";

  const where: Record<string, unknown> = {
    isActive: true,
    minExp: { lte: maxExp },
    maxExp: { gte: minExp },
  };

  if (search) {
    where.OR = [
      { title: { contains: search, mode: "insensitive" } },
      { company: { contains: search, mode: "insensitive" } },
      { skills: { contains: search, mode: "insensitive" } },
      { location: { contains: search, mode: "insensitive" } },
    ];
  }
  if (locations.length) where.city = { in: locations };
  if (companyTypes.length) where.companyType = { in: companyTypes };
  if (jobTypes.length) where.jobType = { in: jobTypes };
  if (industries.length) where.industry = { in: industries };

  if (postedWithin) {
    const days = parseInt(postedWithin);
    where.postedAt = { gte: new Date(Date.now() - days * 24 * 60 * 60 * 1000) };
  }

  if (salaryRange === "under5") {
    where.salaryMax = { lte: 500000, not: null };
  } else if (salaryRange === "5to15") {
    where.salaryMin = { gte: 500000 };
    where.salaryMax = { lte: 1500000 };
  } else if (salaryRange === "15to30") {
    where.salaryMin = { gte: 1500000 };
    where.salaryMax = { lte: 3000000 };
  } else if (salaryRange === "above30") {
    where.salaryMin = { gte: 3000000 };
  }

  const orderBy =
    sort === "salary"
      ? { salaryMax: "desc" as const }
      : sort === "experience"
      ? { minExp: "asc" as const }
      : { postedAt: "desc" as const };

  const [total, jobs] = await Promise.all([
    prisma.job.count({ where }),
    prisma.job.findMany({
      where,
      orderBy,
      skip: (page - 1) * limit,
      take: limit,
      select: {
        id: true, title: true, company: true, logoDomain: true,
        companyType: true, location: true, city: true, country: true,
        lat: true, lng: true, minExp: true, maxExp: true,
        salaryMin: true, salaryMax: true, currency: true,
        jobType: true, industry: true, skills: true, postedAt: true, createdAt: true,
      },
    }),
  ]);

  return NextResponse.json({
    jobs: jobs.map((j) => ({ ...j, skills: safeParseSkills(j.skills) })),
    total,
    page,
    pages: Math.ceil(total / limit),
  });
}

function safeParseSkills(s: string): string[] {
  try { return JSON.parse(s); } catch { return []; }
}

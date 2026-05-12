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
      { title: { contains: search } },
      { company: { contains: search } },
      { skills: { contains: search } },
      { location: { contains: search } },
    ];
  }
  if (locations.length) where.city = { in: locations };
  if (companyTypes.length) where.companyType = { in: companyTypes };
  if (jobTypes.length) where.jobType = { in: jobTypes };
  if (industries.length) where.industry = { in: industries };

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
        id: true,
        title: true,
        company: true,
        logoDomain: true,
        companyType: true,
        location: true,
        city: true,
        country: true,
        lat: true,
        lng: true,
        minExp: true,
        maxExp: true,
        salaryMin: true,
        salaryMax: true,
        currency: true,
        jobType: true,
        industry: true,
        skills: true,
        postedAt: true,
        createdAt: true,
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
  try {
    return JSON.parse(s);
  } catch {
    return [];
  }
}

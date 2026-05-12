import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const email = req.nextUrl.searchParams.get("email");
  if (!email) return NextResponse.json({ jobs: [] });

  const saved = await prisma.savedJob.findMany({
    where: { userEmail: email },
    include: {
      job: {
        select: {
          id: true, title: true, company: true, logoDomain: true,
          companyType: true, location: true, city: true, minExp: true,
          maxExp: true, salaryMin: true, salaryMax: true, currency: true,
          jobType: true, industry: true, skills: true, postedAt: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({
    jobs: saved.map((s) => ({ ...s.job, savedAt: s.createdAt, skills: safeParseSkills(s.job.skills) })),
  });
}

export async function POST(req: NextRequest) {
  const { jobId, userEmail } = await req.json();
  if (!jobId || !userEmail) return NextResponse.json({ error: "Missing fields" }, { status: 400 });

  try {
    await prisma.savedJob.create({ data: { jobId, userEmail } });
    return NextResponse.json({ saved: true });
  } catch {
    return NextResponse.json({ error: "Already saved" }, { status: 409 });
  }
}

export async function DELETE(req: NextRequest) {
  const { jobId, userEmail } = await req.json();
  await prisma.savedJob.deleteMany({ where: { jobId, userEmail } });
  return NextResponse.json({ saved: false });
}

function safeParseSkills(s: string): string[] {
  try { return JSON.parse(s); } catch { return []; }
}

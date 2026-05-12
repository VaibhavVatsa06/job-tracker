import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const job = await prisma.job.findUnique({
    where: { id },
    include: { _count: { select: { applications: true } } },
  });

  if (!job) return NextResponse.json({ error: "Job not found" }, { status: 404 });

  return NextResponse.json({
    ...job,
    skills: safeParseSkills(job.skills),
    applicationCount: job._count.applications,
  });
}

function safeParseSkills(s: string): string[] {
  try {
    return JSON.parse(s);
  } catch {
    return [];
  }
}

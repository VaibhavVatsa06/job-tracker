import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendJobAlertEmail } from "@/lib/email";
import type { Job } from "@/types";

export async function GET() {
  if (!process.env.RESEND_API_KEY) {
    return NextResponse.json({ skipped: true, reason: "RESEND_API_KEY not set" });
  }

  const alerts = await prisma.alert.findMany({ where: { isActive: true } });
  if (alerts.length === 0) return NextResponse.json({ sent: 0 });

  const cutoff = new Date(Date.now() - 48 * 60 * 60 * 1000);
  let sent = 0;

  for (const alert of alerts) {
    const keywords = alert.keywords.split(",").map((k) => k.trim()).filter(Boolean);

    const orConditions = keywords.flatMap((kw) => [
      { title: { contains: kw, mode: "insensitive" as const } },
      { company: { contains: kw, mode: "insensitive" as const } },
      { skills: { contains: kw, mode: "insensitive" as const } },
      { industry: { contains: kw, mode: "insensitive" as const } },
    ]);

    const where: Record<string, unknown> = {
      isActive: true,
      postedAt: { gte: cutoff },
      OR: orConditions,
    };

    if (alert.location) where.city = { contains: alert.location, mode: "insensitive" };
    if (alert.minExp != null) where.maxExp = { gte: alert.minExp };
    if (alert.maxExp != null) where.minExp = { lte: alert.maxExp };

    const rawJobs = await prisma.job.findMany({
      where,
      orderBy: { postedAt: "desc" },
      take: 20,
    });

    if (rawJobs.length === 0) continue;

    const jobs: Job[] = rawJobs.map((j) => ({
      ...j,
      skills: safeParseSkills(j.skills),
      companyType: j.companyType as Job["companyType"],
      jobType: j.jobType as Job["jobType"],
      postedAt: j.postedAt.toISOString(),
      createdAt: j.createdAt.toISOString(),
    }));

    const ok = await sendJobAlertEmail(alert.email, alert.keywords, jobs);
    if (ok) sent++;
  }

  return NextResponse.json({ sent, total: alerts.length });
}

function safeParseSkills(s: string): string[] {
  try { return JSON.parse(s); } catch { return []; }
}

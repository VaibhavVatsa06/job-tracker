import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { jobId, name, email, phone, resumeUrl, coverLetter } = body;

  if (!jobId || !name || !email) {
    return NextResponse.json({ error: "jobId, name and email are required" }, { status: 400 });
  }

  const emailRx = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRx.test(email)) {
    return NextResponse.json({ error: "Invalid email address" }, { status: 400 });
  }

  const job = await prisma.job.findUnique({ where: { id: jobId } });
  if (!job) return NextResponse.json({ error: "Job not found" }, { status: 404 });

  try {
    const application = await prisma.application.create({
      data: { jobId, name, email, phone, resumeUrl, coverLetter },
    });
    return NextResponse.json({ success: true, applicationId: application.id, applyUrl: job.applyUrl });
  } catch (err: unknown) {
    if (err instanceof Error && err.message.includes("Unique constraint")) {
      return NextResponse.json({ error: "You have already applied for this job" }, { status: 409 });
    }
    return NextResponse.json({ error: "Failed to submit application" }, { status: 500 });
  }
}

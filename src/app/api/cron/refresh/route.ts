import { NextRequest, NextResponse } from "next/server";
import { fetchFromJSearch, deactivateOldJobs } from "@/lib/jobService";

// Called by Vercel Cron (vercel.json) or any external scheduler
export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  const token = authHeader?.replace("Bearer ", "");

  if (token !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const [added, expired] = await Promise.all([
    fetchFromJSearch("software developer jobs in India"),
    deactivateOldJobs(),
  ]);

  return NextResponse.json({ ok: true, added, expired, at: new Date().toISOString() });
}

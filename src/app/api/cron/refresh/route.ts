import { NextRequest, NextResponse } from "next/server";
import { fetchAllSources, deactivateOldJobs } from "@/lib/jobService";

// Called by Vercel Cron (vercel.json) every 2 days
export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  const token = authHeader?.replace("Bearer ", "");

  if (token !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const [result, expired] = await Promise.all([
    fetchAllSources(),
    deactivateOldJobs(),
  ]);

  return NextResponse.json({
    ok: true,
    added: result.total,
    breakdown: result.breakdown,
    expired,
    at: new Date().toISOString(),
  });
}

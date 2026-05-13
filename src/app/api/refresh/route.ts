import { NextResponse } from "next/server";
import { fetchAllSources, deactivateOldJobs } from "@/lib/jobService";

export async function POST() {
  if (!process.env.RAPIDAPI_KEY) {
    return NextResponse.json({ error: "RAPIDAPI_KEY not set. Add it to your environment variables." }, { status: 400 });
  }

  const [result, expired] = await Promise.all([
    fetchAllSources(),
    deactivateOldJobs(),
  ]);

  return NextResponse.json({
    success: true,
    added: result.total,
    breakdown: result.breakdown,
    expired,
    message: `Fetched ${result.total} new jobs (JSearch: ${result.breakdown.jsearch}, Adzuna: ${result.breakdown.adzuna}, Remotive: ${result.breakdown.remotive}), expired ${expired} old ones.`,
  });
}

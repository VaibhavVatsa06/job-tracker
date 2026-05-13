import { NextResponse } from "next/server";
import { fetchAllSources, deactivateOldJobs } from "@/lib/jobService";

export async function POST() {
  const [result, expired] = await Promise.all([
    fetchAllSources(),
    deactivateOldJobs(),
  ]);

  const b = result.breakdown;
  const parts = [
    b.jsearch    ? `JSearch: ${b.jsearch}`       : null,
    b.adzuna     ? `Adzuna: ${b.adzuna}`         : null,
    b.remotive   ? `Remotive: ${b.remotive}`     : null,
    b.greenhouse !== undefined ? `Greenhouse: ${b.greenhouse}` : null,
    b.remoteok   ? `RemoteOK: ${b.remoteok}`     : null,
  ].filter(Boolean).join(", ");

  return NextResponse.json({
    success: true,
    added: result.total,
    breakdown: result.breakdown,
    expired,
    message: `Fetched ${result.total} new jobs (${parts}), expired ${expired} old ones.`,
  });
}

import { NextResponse } from "next/server";
import { fetchFromJSearch, deactivateOldJobs } from "@/lib/jobService";

export async function POST() {
  if (!process.env.RAPIDAPI_KEY) {
    return NextResponse.json({ error: "RAPIDAPI_KEY not set. Add it to your environment variables." }, { status: 400 });
  }

  const [added, expired] = await Promise.all([
    fetchFromJSearch(), // runs all 10 daily queries
    deactivateOldJobs(),
  ]);

  return NextResponse.json({
    success: true,
    added,
    expired,
    message: `Fetched ${added} new jobs, expired ${expired} old ones.`,
  });
}

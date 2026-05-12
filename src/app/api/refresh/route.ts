import { NextResponse } from "next/server";
import { fetchFromJSearch, deactivateOldJobs } from "@/lib/jobService";

export async function POST() {
  const [added, expired] = await Promise.all([
    fetchFromJSearch("software developer jobs in India"),
    deactivateOldJobs(),
  ]);
  return NextResponse.json({ added, expired });
}

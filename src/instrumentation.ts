// Runs once when the Next.js server starts (Node.js runtime only).
// Seeds the database on first start. Cron scheduling is handled
// by Vercel Cron (vercel.json) or an external scheduler in production.
export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;

  try {
    const { seedMockJobs } = await import("./lib/jobService");
    const result = await seedMockJobs();
    if (result.seeded > 0) {
      console.log(`[startup] Seeded ${result.seeded} jobs into the database`);
    }
  } catch (e) {
    console.error("[startup] Could not seed database:", e);
  }
}

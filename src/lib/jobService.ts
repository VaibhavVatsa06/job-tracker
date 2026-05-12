import axios from "axios";
import { prisma } from "./prisma";
import { MOCK_JOBS } from "./mockData";

export async function seedMockJobs() {
  const count = await prisma.job.count();
  if (count > 0) return { seeded: 0, message: "Already seeded" };

  const created = await prisma.job.createMany({
    data: MOCK_JOBS.map((j) => ({
      ...j,
      lat: j.lat ?? undefined,
      lng: j.lng ?? undefined,
      salaryMin: j.salaryMin ?? undefined,
      salaryMax: j.salaryMax ?? undefined,
      postedAt: new Date(j.postedAt),
    })),
  });

  return { seeded: created.count, message: `Seeded ${created.count} jobs` };
}

export async function fetchFromJSearch(query = "software engineer jobs in India"): Promise<number> {
  const apiKey = process.env.RAPIDAPI_KEY;
  if (!apiKey) return 0;

  try {
    const res = await axios.get("https://jsearch.p.rapidapi.com/search", {
      headers: {
        "X-RapidAPI-Key": apiKey,
        "X-RapidAPI-Host": process.env.RAPIDAPI_HOST || "jsearch.p.rapidapi.com",
      },
      params: { query, page: "1", num_pages: "2", date_posted: "today" },
    });

    const jobs = res.data?.data ?? [];
    let created = 0;

    for (const j of jobs) {
      const expMonths = j.job_required_experience?.required_experience_in_months ?? 0;
      const minExp = Math.max(1, Math.floor(expMonths / 12));
      const maxExp = minExp + 2;

      try {
        await prisma.job.upsert({
          where: { id: j.job_id },
          update: { isActive: true, updatedAt: new Date() },
          create: {
            id: j.job_id,
            title: j.job_title,
            company: j.employer_name,
            logoDomain: extractDomain(j.employer_website),
            companyType: inferCompanyType(j.employer_name, j.employer_company_type),
            location: [j.job_city, j.job_state, j.job_country].filter(Boolean).join(", "),
            city: j.job_city || "Remote",
            country: j.job_country || "India",
            lat: j.job_latitude ?? undefined,
            lng: j.job_longitude ?? undefined,
            minExp,
            maxExp,
            salaryMin: j.job_min_salary ?? undefined,
            salaryMax: j.job_max_salary ?? undefined,
            currency: j.job_salary_currency || "INR",
            jobType: normalizeJobType(j.job_employment_type),
            industry: inferIndustry(j.job_title),
            skills: JSON.stringify(j.job_required_skills ?? []),
            description: j.job_description,
            applyUrl: j.job_apply_link || j.job_google_link,
            source: "jsearch",
            postedAt: j.job_posted_at_datetime_utc ? new Date(j.job_posted_at_datetime_utc) : new Date(),
          },
        });
        created++;
      } catch {
        // skip duplicates
      }
    }
    return created;
  } catch (err) {
    console.error("JSearch fetch error:", err);
    return 0;
  }
}

export async function deactivateOldJobs() {
  const cutoff = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const result = await prisma.job.updateMany({
    where: { postedAt: { lt: cutoff }, isActive: true, source: { not: "mock" } },
    data: { isActive: false },
  });
  return result.count;
}

function extractDomain(url?: string): string | null {
  if (!url) return null;
  try {
    return new URL(url).hostname.replace("www.", "");
  } catch {
    return null;
  }
}

function inferCompanyType(name: string, type?: string): string {
  if (type) {
    if (type.toLowerCase().includes("startup")) return "Startup";
    if (type.toLowerCase().includes("corporation")) return "MNC";
  }
  const indianIT = ["infosys", "wipro", "tcs", "hcl", "tech mahindra", "mphasis", "hexaware"];
  if (indianIT.some((it) => name.toLowerCase().includes(it))) return "IndianIT";
  return "MNC";
}

function normalizeJobType(type?: string): string {
  if (!type) return "Full-time";
  const t = type.toUpperCase();
  if (t.includes("PART")) return "Part-time";
  if (t.includes("REMOTE")) return "Remote";
  if (t.includes("HYBRID") || t.includes("FLEX")) return "Hybrid";
  return "Full-time";
}

function inferIndustry(title: string): string {
  const t = title.toLowerCase();
  if (t.includes("data") || t.includes("ml") || t.includes("ai") || t.includes("machine")) return "Data & AI";
  if (t.includes("security") || t.includes("cyber")) return "Cybersecurity";
  if (t.includes("devops") || t.includes("sre") || t.includes("cloud") || t.includes("infra")) return "DevOps & Cloud";
  if (t.includes("product manager") || t.includes("product owner")) return "Product Management";
  if (t.includes("design") || t.includes("ux") || t.includes("ui")) return "Design";
  if (t.includes("finance") || t.includes("fintech") || t.includes("banking")) return "Finance & Fintech";
  if (t.includes("sales") || t.includes("marketing")) return "Sales & Marketing";
  if (t.includes("hr") || t.includes("talent") || t.includes("recruiter")) return "HR & Talent";
  return "Software Engineering";
}

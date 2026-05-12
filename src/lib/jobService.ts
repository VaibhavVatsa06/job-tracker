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

// Search queries run daily — covers a broad range of roles across India + remote
const DAILY_QUERIES = [
  "software engineer jobs in Bangalore India",
  "software developer jobs in Mumbai India",
  "data scientist machine learning jobs in India",
  "devops cloud engineer jobs in India",
  "product manager jobs in India",
  "react node fullstack developer jobs in Hyderabad India",
  "remote software engineer jobs India",
  "startup tech jobs India",
  "backend engineer python golang jobs India",
  "frontend developer react angular jobs India",
];

export async function fetchFromJSearch(query?: string): Promise<number> {
  const apiKey = process.env.RAPIDAPI_KEY;
  if (!apiKey) return 0;

  const queries = query ? [query] : DAILY_QUERIES;
  let totalCreated = 0;

  for (const q of queries) {
    try {
      const res = await axios.get("https://jsearch.p.rapidapi.com/search", {
        headers: {
          "X-RapidAPI-Key": apiKey,
          "X-RapidAPI-Host": process.env.RAPIDAPI_HOST || "jsearch.p.rapidapi.com",
        },
        params: { query: q, page: "1", num_pages: "1", date_posted: "today" },
        timeout: 10000,
      });

      const jobs = res.data?.data ?? [];

      for (const j of jobs) {
        const expMonths = j.job_required_experience?.required_experience_in_months ?? 0;
        const minExp = Math.max(1, Math.floor(expMonths / 12));
        const maxExp = Math.min(10, minExp + 2);

        const jobData = {
          title: j.job_title ?? "Software Engineer",
          company: j.employer_name ?? "Unknown Company",
          logoDomain: extractDomain(j.employer_website),
          companyType: inferCompanyType(j.employer_name, j.employer_company_type),
          location: buildLocation(j.job_city, j.job_state, j.job_country),
          city: normalizeCity(j.job_city, j.job_is_remote),
          country: j.job_country || "India",
          lat: j.job_latitude ?? null,
          lng: j.job_longitude ?? null,
          minExp,
          maxExp,
          salaryMin: j.job_min_salary ? Math.round(j.job_min_salary) : null,
          salaryMax: j.job_max_salary ? Math.round(j.job_max_salary) : null,
          currency: j.job_salary_currency || "INR",
          jobType: normalizeJobType(j.job_employment_type, j.job_is_remote),
          industry: inferIndustry(j.job_title),
          skills: JSON.stringify(extractSkills(j)),
          description: j.job_description ?? "",
          applyUrl: j.job_apply_link || j.job_google_link || "#",
          source: "jsearch",
          isActive: true,
          postedAt: j.job_posted_at_datetime_utc ? new Date(j.job_posted_at_datetime_utc) : new Date(),
        };

        try {
          await prisma.job.upsert({
            where: { id: j.job_id },
            update: { isActive: true, updatedAt: new Date() },
            create: { id: j.job_id, ...jobData },
          });
          totalCreated++;
        } catch {
          // skip if upsert fails for this record
        }
      }
    } catch (err) {
      console.error(`[JSearch] Error for query "${q}":`, (err as Error).message);
    }

    // Small delay between requests to respect rate limits
    await sleep(500);
  }

  return totalCreated;
}

export async function deactivateOldJobs(): Promise<number> {
  const cutoff = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const result = await prisma.job.updateMany({
    where: { postedAt: { lt: cutoff }, isActive: true, source: { not: "mock" } },
    data: { isActive: false },
  });
  return result.count;
}

// ── Helpers ────────────────────────────────────────────────────────────────

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

function extractDomain(url?: string): string | null {
  if (!url) return null;
  try {
    return new URL(url).hostname.replace("www.", "");
  } catch {
    return null;
  }
}

function buildLocation(city?: string, state?: string, country?: string): string {
  return [city, state, country].filter(Boolean).join(", ");
}

function normalizeCity(city?: string, isRemote?: boolean): string {
  if (isRemote || !city) return "Remote";
  const cityMap: Record<string, string> = {
    Bengaluru: "Bangalore",
    "New Delhi": "Delhi NCR",
    Gurugram: "Delhi NCR",
    Gurgaon: "Delhi NCR",
    Noida: "Delhi NCR",
    Secunderabad: "Hyderabad",
  };
  return cityMap[city] || city;
}

function inferCompanyType(name: string, type?: string): string {
  if (type) {
    const t = type.toLowerCase();
    if (t.includes("startup") || t.includes("small")) return "Startup";
    if (t.includes("corporation") || t.includes("enterprise")) return "MNC";
  }
  const indianIT = ["infosys", "wipro", "tcs", "tata", "hcl", "tech mahindra", "mphasis", "hexaware", "zensar", "persistent", "cognizant", "capgemini"];
  const mncs = ["google", "microsoft", "amazon", "apple", "meta", "netflix", "adobe", "salesforce", "oracle", "ibm", "accenture", "deloitte", "kpmg", "pwc", "ey", "atlassian", "stripe", "shopify"];
  const lname = name.toLowerCase();
  if (mncs.some((m) => lname.includes(m))) return "MNC";
  if (indianIT.some((it) => lname.includes(it))) return "IndianIT";
  return "Startup";
}

function normalizeJobType(type?: string, isRemote?: boolean): string {
  if (isRemote) return "Remote";
  if (!type) return "Full-time";
  const t = type.toUpperCase();
  if (t.includes("PART")) return "Part-time";
  if (t.includes("REMOTE")) return "Remote";
  if (t.includes("HYBRID") || t.includes("FLEX")) return "Hybrid";
  if (t.includes("CONTRACTOR") || t.includes("CONTRACT")) return "Part-time";
  return "Full-time";
}

function inferIndustry(title?: string): string {
  const t = (title || "").toLowerCase();
  if (t.match(/data|ml|ai|machine learning|analytics|scientist|nlp|llm/)) return "Data & AI";
  if (t.match(/security|cyber|soc|penetration|vulnerability/)) return "Cybersecurity";
  if (t.match(/devops|sre|cloud|infrastructure|platform|kubernetes|terraform/)) return "DevOps & Cloud";
  if (t.match(/product manager|product owner|program manager/)) return "Product Management";
  if (t.match(/design|ux|ui|figma|creative/)) return "Design";
  if (t.match(/finance|fintech|banking|payment|trading/)) return "Finance & Fintech";
  if (t.match(/sales|marketing|growth|business development|seo/)) return "Sales & Marketing";
  if (t.match(/hr|talent|recruiter|people|workforce/)) return "HR & Talent";
  if (t.match(/operations|supply chain|logistics/)) return "Operations";
  return "Software Engineering";
}

function extractSkills(job: Record<string, unknown>): string[] {
  const skills = (job.job_required_skills as string[] | null) ?? [];
  if (skills.length > 0) return skills.slice(0, 8);

  // Fallback: extract from title
  const title = ((job.job_title as string) || "").toLowerCase();
  const skillMap: Record<string, string[]> = {
    react: ["React", "JavaScript", "TypeScript"],
    angular: ["Angular", "TypeScript", "RxJS"],
    node: ["Node.js", "JavaScript", "Express"],
    python: ["Python", "FastAPI", "Django"],
    java: ["Java", "Spring Boot", "Maven"],
    golang: ["Go", "gRPC", "Microservices"],
    devops: ["AWS", "Docker", "Kubernetes", "CI/CD"],
    "data science": ["Python", "ML", "TensorFlow", "SQL"],
    "machine learning": ["Python", "PyTorch", "ML", "Scikit-learn"],
    "product manager": ["Product Roadmap", "Agile", "SQL", "User Research"],
    aws: ["AWS", "Cloud", "Terraform", "Python"],
  };

  for (const [key, vals] of Object.entries(skillMap)) {
    if (title.includes(key)) return vals;
  }
  return [];
}

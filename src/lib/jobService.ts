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

async function fetchOneJSearch(q: string, apiKey: string): Promise<number> {
  try {
    const res = await axios.get("https://jsearch.p.rapidapi.com/search", {
      headers: {
        "X-RapidAPI-Key": apiKey,
        "X-RapidAPI-Host": process.env.RAPIDAPI_HOST || "jsearch.p.rapidapi.com",
      },
      params: { query: q, page: "1", num_pages: "1", date_posted: "today" },
      timeout: 8000,
    });
    const jobs = res.data?.data ?? [];
    const rows = jobs.map((j: any) => {
      const expMonths = j.job_required_experience?.required_experience_in_months ?? 0;
      const minExp = Math.max(1, Math.floor(expMonths / 12));
      return {
        id: j.job_id,
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
        maxExp: Math.min(10, minExp + 2),
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
    }).filter((r: any) => r.id);
    if (!rows.length) return 0;
    const result = await prisma.job.createMany({ data: rows, skipDuplicates: true });
    return result.count;
  } catch (err) {
    console.error(`[JSearch] "${q}":`, (err as Error).message);
    return 0;
  }
}

export async function fetchFromJSearch(query?: string): Promise<number> {
  const apiKey = process.env.RAPIDAPI_KEY;
  if (!apiKey) return 0;
  const queries = query ? [query] : DAILY_QUERIES;
  // Run all queries in parallel — cuts 10×500ms serial into ~1 RTT
  const results = await Promise.allSettled(queries.map((q) => fetchOneJSearch(q, apiKey)));
  return results.reduce((sum, r) => sum + (r.status === "fulfilled" ? r.value : 0), 0);
}

// ── Adzuna API (free, covers India + global) ───────────────────────────────

const ADZUNA_QUERIES = [
  { what: "software engineer", where: "India", country: "in" },
  { what: "data scientist", where: "India", country: "in" },
  { what: "devops cloud engineer", where: "India", country: "in" },
  { what: "fullstack developer", where: "India", country: "in" },
  { what: "software developer", where: "Singapore", country: "sg" },
  { what: "software engineer", where: "London", country: "gb" },
  { what: "software engineer", where: "Dubai", country: "ae" },
];

export async function fetchFromAdzuna(): Promise<number> {
  const appId = process.env.ADZUNA_APP_ID;
  const appKey = process.env.ADZUNA_APP_KEY;
  if (!appId || !appKey) return 0;

  let total = 0;

  for (const { what, where, country } of ADZUNA_QUERIES) {
    try {
      const res = await axios.get(
        `https://api.adzuna.com/v1/api/jobs/${country}/search/1`,
        {
          params: {
            app_id: appId,
            app_key: appKey,
            results_per_page: 20,
            what,
            where,
            "content-type": "application/json",
          },
          timeout: 12000,
        }
      );

      const jobs = res.data?.results ?? [];
      for (const j of jobs) {
        const id = `adzuna_${j.id}`;
        const rawCity =
          j.location?.area?.[3] ||
          j.location?.area?.[2] ||
          j.location?.display_name?.split(",")[0]?.trim() ||
          where;
        const city = normalizeCity(rawCity, false);
        const companyName: string = j.company?.display_name ?? "Unknown";
        const guessedDomain = companyName.toLowerCase().replace(/[^a-z0-9]/g, "") + ".com";

        const jobData = {
          title: j.title ?? "Software Engineer",
          company: companyName,
          logoDomain: guessedDomain,
          companyType: inferCompanyType(companyName, undefined),
          location: j.location?.display_name ?? where,
          city,
          country: { in: "India", sg: "Singapore", gb: "UK", ae: "UAE" }[country] ?? country.toUpperCase(),
          lat: j.latitude ?? null,
          lng: j.longitude ?? null,
          minExp: 1,
          maxExp: 5,
          salaryMin: j.salary_min ? Math.round(j.salary_min) : null,
          salaryMax: j.salary_max ? Math.round(j.salary_max) : null,
          currency: { in: "INR", sg: "SGD", gb: "GBP", ae: "AED" }[country] ?? "USD",
          jobType: "Full-time" as const,
          industry: inferIndustry(j.title),
          skills: JSON.stringify(extractSkillsFromTitle(j.title ?? "")),
          description: j.description ?? "",
          applyUrl: j.redirect_url ?? "#",
          source: "adzuna",
          isActive: true,
          postedAt: j.created ? new Date(j.created) : new Date(),
        };

        try {
          await prisma.job.upsert({
            where: { id },
            update: { isActive: true, updatedAt: new Date() },
            create: { id, ...jobData },
          });
          total++;
        } catch { /* skip duplicates */ }
      }
    } catch (err) {
      console.error(`[Adzuna] Error for "${what}" in ${where}:`, (err as Error).message);
    }
    await sleep(400);
  }

  return total;
}

// ── Remotive API (free, no key needed — remote tech jobs) ──────────────────

const REMOTIVE_CATEGORIES = [
  "software-dev",
  "devops-sysadmin",
  "data",
  "product",
  "design",
];

export async function fetchFromRemotive(): Promise<number> {
  let total = 0;

  for (const category of REMOTIVE_CATEGORIES) {
    try {
      const res = await axios.get("https://remotive.com/api/remote-jobs", {
        params: { category, limit: 30 },
        timeout: 12000,
      });

      const jobs = res.data?.jobs ?? [];
      for (const j of jobs) {
        const id = `remotive_${j.id}`;
        const logoUrl: string = j.company_logo_url ?? j.company_logo ?? "";
        let logoDomain: string | null = null;
        try { logoDomain = new URL(logoUrl).hostname.replace("www.", ""); } catch {}

        const jobData = {
          title: j.title ?? "Software Engineer",
          company: j.company_name ?? "Unknown",
          logoDomain,
          companyType: inferCompanyType(j.company_name ?? "", undefined),
          location: "Remote Worldwide",
          city: "Remote",
          country: "Worldwide",
          lat: null,
          lng: null,
          minExp: 1,
          maxExp: 5,
          salaryMin: parseSalaryBound(j.salary, "min"),
          salaryMax: parseSalaryBound(j.salary, "max"),
          currency: "USD",
          jobType: "Remote" as const,
          industry: inferIndustry(j.title),
          skills: JSON.stringify((j.tags ?? []).slice(0, 8)),
          description: (j.description ?? "").replace(/<[^>]+>/g, "").slice(0, 2000),
          applyUrl: j.url ?? "#",
          source: "remotive",
          isActive: true,
          postedAt: j.publication_date ? new Date(j.publication_date) : new Date(),
        };

        try {
          await prisma.job.upsert({
            where: { id },
            update: { isActive: true, updatedAt: new Date() },
            create: { id, ...jobData },
          });
          total++;
        } catch { /* skip duplicates */ }
      }
    } catch (err) {
      console.error(`[Remotive] Error for "${category}":`, (err as Error).message);
    }
    await sleep(300);
  }

  return total;
}

// ── Lever (free public API — no key needed) ───────────────────────────────

const LEVER_COMPANIES: { slug: string; name: string; domain: string }[] = [
  { slug: "netflix", name: "Netflix", domain: "netflix.com" },
  { slug: "reddit", name: "Reddit", domain: "reddit.com" },
  { slug: "plaid", name: "Plaid", domain: "plaid.com" },
  { slug: "brex", name: "Brex", domain: "brex.com" },
  { slug: "airtable", name: "Airtable", domain: "airtable.com" },
  { slug: "rippling", name: "Rippling", domain: "rippling.com" },
  { slug: "lattice", name: "Lattice", domain: "lattice.com" },
  { slug: "intercom", name: "Intercom", domain: "intercom.com" },
  { slug: "mixpanel", name: "Mixpanel", domain: "mixpanel.com" },
  { slug: "asana", name: "Asana", domain: "asana.com" },
  { slug: "squarespace", name: "Squarespace", domain: "squarespace.com" },
  { slug: "deliveroo", name: "Deliveroo", domain: "deliveroo.com" },
];

function parseLeverCity(location: string): string {
  if (!location) return "Remote";
  const l = location.toLowerCase();
  if (l.includes("remote")) return "Remote";
  const map: Record<string, string> = {
    "san francisco": "San Francisco", "los gatos": "San Francisco",
    "los angeles": "San Francisco", "palo alto": "San Francisco",
    "menlo park": "San Francisco", "sunnyvale": "San Francisco",
    "mountain view": "San Francisco", "san jose": "San Francisco",
    "new york": "New York", "seattle": "Seattle", "austin": "Austin",
    "toronto": "Toronto", "london": "London", "amsterdam": "Amsterdam",
    "berlin": "Berlin", "paris": "Paris", "singapore": "Singapore",
    "sydney": "Sydney", "bangalore": "Bangalore", "bengaluru": "Bangalore",
    "hyderabad": "Hyderabad", "dubai": "Dubai", "tokyo": "Tokyo",
  };
  for (const [key, city] of Object.entries(map)) {
    if (l.includes(key)) return city;
  }
  return location.split(",")[0].trim() || "Remote";
}

function parseLeverCountry(location: string): string {
  const l = location.toLowerCase();
  if (l.includes("india") || l.includes("bangalore") || l.includes("hyderabad")) return "India";
  if (l.includes("united kingdom") || l.includes("london") || l.includes(" uk")) return "UK";
  if (l.includes("singapore")) return "Singapore";
  if (l.includes("australia") || l.includes("sydney")) return "Australia";
  if (l.includes("germany") || l.includes("berlin")) return "Germany";
  if (l.includes("canada") || l.includes("toronto")) return "Canada";
  return "USA";
}

function parseLeverJobType(commitment: string | undefined): "Remote" | "Full-time" | "Part-time" | "Hybrid" {
  if (!commitment) return "Full-time";
  const c = commitment.toLowerCase();
  if (c.includes("remote")) return "Remote";
  if (c.includes("hybrid")) return "Hybrid";
  if (c.includes("part")) return "Part-time";
  return "Full-time";
}

async function fetchOneLever(company: { slug: string; name: string; domain: string }): Promise<number> {
  try {
    const res = await axios.get(
      `https://api.lever.co/v0/postings/${company.slug}?mode=json`,
      { timeout: 8000 }
    );
    const jobs: any[] = Array.isArray(res.data) ? res.data : [];
    const rows = jobs.map((j) => {
      const locationStr: string = j.categories?.location ?? "";
      return {
        id: `lever-${company.slug}-${j.id}`,
        title: j.text ?? "Software Engineer",
        company: company.name,
        logoDomain: company.domain,
        companyType: inferCompanyType(company.name, undefined),
        location: locationStr || company.name,
        city: parseLeverCity(locationStr),
        country: parseLeverCountry(locationStr),
        lat: null as null,
        lng: null as null,
        minExp: 1,
        maxExp: 7,
        salaryMin: null as null,
        salaryMax: null as null,
        currency: "USD",
        jobType: parseLeverJobType(j.categories?.commitment),
        industry: inferIndustry(j.text),
        skills: JSON.stringify(extractSkillsFromTitle(j.text ?? "")),
        description: (j.descriptionPlain ?? j.description ?? "").replace(/<[^>]+>/g, "").slice(0, 2000),
        applyUrl: j.hostedUrl ?? `https://jobs.lever.co/${company.slug}`,
        source: "lever",
        isActive: true,
        postedAt: j.createdAt ? new Date(j.createdAt) : new Date(),
      };
    });
    if (!rows.length) return 0;
    const result = await prisma.job.createMany({ data: rows, skipDuplicates: true });
    return result.count;
  } catch (err) {
    console.error(`[Lever] ${company.slug}:`, (err as Error).message);
    return 0;
  }
}

export async function fetchFromLever(): Promise<number> {
  const results = await Promise.allSettled(
    LEVER_COMPANIES.map((c) => fetchOneLever(c))
  );
  return results.reduce((sum, r) => sum + (r.status === "fulfilled" ? r.value : 0), 0);
}

// ── Workday (free public REST API — no key needed) ─────────────────────────

interface WorkdayCompany {
  name: string;
  domain: string;
  apiUrl: string;
  jobBaseUrl: string;
}

const WORKDAY_COMPANIES: WorkdayCompany[] = [
  {
    name: "Apple",
    domain: "apple.com",
    apiUrl: "https://apple.wd1.myworkdayjobs.com/wday/cxs/apple/US_Jobs/jobs",
    jobBaseUrl: "https://apple.wd1.myworkdayjobs.com/en-US/US_Jobs",
  },
  {
    name: "Adobe",
    domain: "adobe.com",
    apiUrl: "https://adobe.wd5.myworkdayjobs.com/wday/cxs/adobe/external_experienced/jobs",
    jobBaseUrl: "https://adobe.wd5.myworkdayjobs.com/external_experienced",
  },
  {
    name: "Salesforce",
    domain: "salesforce.com",
    apiUrl: "https://salesforce.wd1.myworkdayjobs.com/wday/cxs/Salesforce/External_Career_Site/jobs",
    jobBaseUrl: "https://salesforce.wd1.myworkdayjobs.com/External_Career_Site",
  },
  {
    name: "Workday",
    domain: "workday.com",
    apiUrl: "https://workday.wd5.myworkdayjobs.com/wday/cxs/workday/Workday/jobs",
    jobBaseUrl: "https://workday.wd5.myworkdayjobs.com/Workday",
  },
];

function parseWorkdayCity(locationsText: string | undefined): string {
  if (!locationsText) return "Remote";
  const l = locationsText.toLowerCase();
  if (l.includes("remote")) return "Remote";
  const map: Record<string, string> = {
    "cupertino": "San Francisco", "san francisco": "San Francisco",
    "san jose": "San Francisco", "sunnyvale": "San Francisco",
    "mountain view": "San Francisco", "san mateo": "San Francisco",
    "new york": "New York", "seattle": "Seattle", "austin": "Austin",
    "toronto": "Toronto", "london": "London", "amsterdam": "Amsterdam",
    "berlin": "Berlin", "paris": "Paris", "singapore": "Singapore",
    "sydney": "Sydney", "bangalore": "Bangalore", "bengaluru": "Bangalore",
    "hyderabad": "Hyderabad", "dubai": "Dubai", "tokyo": "Tokyo",
  };
  for (const [key, city] of Object.entries(map)) {
    if (l.includes(key)) return city;
  }
  return locationsText.split(",")[0].trim() || "Remote";
}

function parseWorkdayCountry(locationsText: string | undefined): string {
  if (!locationsText) return "USA";
  const l = locationsText.toLowerCase();
  if (l.includes("india") || l.includes("bangalore")) return "India";
  if (l.includes("united kingdom") || l.includes("london")) return "UK";
  if (l.includes("singapore")) return "Singapore";
  if (l.includes("australia") || l.includes("sydney")) return "Australia";
  if (l.includes("germany") || l.includes("berlin")) return "Germany";
  if (l.includes("canada") || l.includes("toronto")) return "Canada";
  return "USA";
}

function parseWorkdayJobType(bulletFields: string[] | undefined): "Remote" | "Full-time" | "Part-time" | "Hybrid" {
  if (!bulletFields?.length) return "Full-time";
  const text = bulletFields.join(" ").toLowerCase();
  if (text.includes("remote")) return "Remote";
  if (text.includes("hybrid")) return "Hybrid";
  if (text.includes("part time") || text.includes("part-time")) return "Part-time";
  return "Full-time";
}

function parseWorkdayDate(dateStr: string | undefined): Date {
  if (!dateStr) return new Date();
  // Workday uses MM/DD/YYYY
  const parts = dateStr.split("/");
  if (parts.length === 3) {
    return new Date(`${parts[2]}-${parts[0].padStart(2, "0")}-${parts[1].padStart(2, "0")}`);
  }
  return new Date(dateStr);
}

async function fetchOneWorkday(company: WorkdayCompany): Promise<number> {
  try {
    const res = await axios.post(
      company.apiUrl,
      { limit: 50, offset: 0, searchText: "" },
      { headers: { "Content-Type": "application/json" }, timeout: 10000 }
    );
    const jobs: any[] = res.data?.jobPostings ?? [];
    const rows = jobs.map((j) => {
      const slug = j.jobPostingId ?? j.externalPath ?? Math.random().toString(36).slice(2);
      const applyUrl = j.externalPath
        ? `${company.jobBaseUrl}${j.externalPath}`
        : company.jobBaseUrl;
      return {
        id: `workday-${company.name.toLowerCase().replace(/\s+/g, "-")}-${slug}`,
        title: j.title ?? "Software Engineer",
        company: company.name,
        logoDomain: company.domain,
        companyType: "MNC" as const,
        location: j.locationsText || company.name,
        city: parseWorkdayCity(j.locationsText),
        country: parseWorkdayCountry(j.locationsText),
        lat: null as null,
        lng: null as null,
        minExp: 1,
        maxExp: 7,
        salaryMin: null as null,
        salaryMax: null as null,
        currency: "USD",
        jobType: parseWorkdayJobType(j.bulletFields),
        industry: inferIndustry(j.title),
        skills: JSON.stringify(extractSkillsFromTitle(j.title ?? "")),
        description: "",
        applyUrl,
        source: "workday",
        isActive: true,
        postedAt: parseWorkdayDate(j.postedOn),
      };
    });
    if (!rows.length) return 0;
    const result = await prisma.job.createMany({ data: rows, skipDuplicates: true });
    return result.count;
  } catch (err) {
    console.error(`[Workday] ${company.name}:`, (err as Error).message);
    return 0;
  }
}

export async function fetchFromWorkday(): Promise<number> {
  const results = await Promise.allSettled(
    WORKDAY_COMPANIES.map((c) => fetchOneWorkday(c))
  );
  return results.reduce((sum, r) => sum + (r.status === "fulfilled" ? r.value : 0), 0);
}

// ── Greenhouse ─────────────────────────────────────────────────────────────
// Public Greenhouse job board API — no key needed
const GREENHOUSE_COMPANIES: { slug: string; name: string; domain: string }[] = [
  { slug: "airbnb", name: "Airbnb", domain: "airbnb.com" },
  { slug: "stripe", name: "Stripe", domain: "stripe.com" },
  { slug: "figma", name: "Figma", domain: "figma.com" },
  { slug: "discord", name: "Discord", domain: "discord.com" },
  { slug: "notion", name: "Notion", domain: "notion.so" },
  { slug: "lyft", name: "Lyft", domain: "lyft.com" },
  { slug: "twilio", name: "Twilio", domain: "twilio.com" },
  { slug: "hashicorp", name: "HashiCorp", domain: "hashicorp.com" },
  { slug: "mongodb", name: "MongoDB", domain: "mongodb.com" },
  { slug: "elastic", name: "Elastic", domain: "elastic.co" },
  { slug: "cloudflare", name: "Cloudflare", domain: "cloudflare.com" },
  { slug: "databricks", name: "Databricks", domain: "databricks.com" },
  { slug: "snowflake", name: "Snowflake", domain: "snowflake.com" },
  { slug: "hubspot", name: "HubSpot", domain: "hubspot.com" },
  { slug: "gitlab", name: "GitLab", domain: "gitlab.com" },
  { slug: "zendesk", name: "Zendesk", domain: "zendesk.com" },
  { slug: "duolingo", name: "Duolingo", domain: "duolingo.com" },
  { slug: "canva", name: "Canva", domain: "canva.com" },
  { slug: "coinbase", name: "Coinbase", domain: "coinbase.com" },
  { slug: "doordash", name: "DoorDash", domain: "doordash.com" },
];

function parseGreenhouseCity(locationName: string | undefined): string {
  if (!locationName) return "Remote";
  const l = locationName.toLowerCase();
  if (l.includes("remote")) return "Remote";
  const cityMap: Record<string, string> = {
    "san francisco": "San Francisco", "new york": "New York", "seattle": "Seattle",
    "austin": "Austin", "toronto": "Toronto", "london": "London",
    "amsterdam": "Amsterdam", "berlin": "Berlin", "paris": "Paris",
    "singapore": "Singapore", "sydney": "Sydney", "bangalore": "Bangalore",
    "bengaluru": "Bangalore", "hyderabad": "Hyderabad", "dubai": "Dubai",
    "tokyo": "Tokyo",
  };
  for (const [key, city] of Object.entries(cityMap)) {
    if (l.includes(key)) return city;
  }
  return locationName.split(",")[0].trim();
}

function parseGreenhouseCountry(locationName: string | undefined): string {
  if (!locationName) return "USA";
  const l = locationName.toLowerCase();
  if (l.includes("india") || l.includes("bangalore") || l.includes("hyderabad")) return "India";
  if (l.includes("uk") || l.includes("london") || l.includes("united kingdom")) return "UK";
  if (l.includes("singapore")) return "Singapore";
  if (l.includes("australia") || l.includes("sydney")) return "Australia";
  if (l.includes("germany") || l.includes("berlin")) return "Germany";
  if (l.includes("canada") || l.includes("toronto")) return "Canada";
  return "USA";
}

async function fetchOneGreenhouse(company: { slug: string; name: string; domain: string }): Promise<number> {
  try {
    const res = await axios.get(
      `https://boards-api.greenhouse.io/v1/boards/${company.slug}/jobs`,
      { timeout: 8000 }
    );
    const jobs: any[] = res.data?.jobs ?? [];
    const rows = jobs.map((j) => {
      const city = parseGreenhouseCity(j.location?.name);
      return {
        id: `greenhouse-${company.slug}-${j.id}`,
        title: j.title ?? "Software Engineer",
        company: company.name,
        logoDomain: company.domain,
        companyType: inferCompanyType(company.name, undefined),
        location: j.location?.name || company.name,
        city,
        country: parseGreenhouseCountry(j.location?.name),
        lat: null as null,
        lng: null as null,
        minExp: 0,
        maxExp: 5,
        salaryMin: null as null,
        salaryMax: null as null,
        currency: "USD",
        jobType: city === "Remote" ? "Remote" : ("Full-time" as const),
        industry: inferIndustry(j.title),
        skills: JSON.stringify(extractSkillsFromTitle(j.title)),
        description: (j.content ?? "").replace(/<[^>]+>/g, "").slice(0, 2000),
        applyUrl: j.absolute_url ?? `https://boards.greenhouse.io/${company.slug}`,
        source: "greenhouse",
        isActive: true,
        postedAt: j.updated_at ? new Date(j.updated_at) : new Date(),
      };
    });
    if (!rows.length) return 0;
    // One batch insert instead of N individual upserts — ~100x faster
    const result = await prisma.job.createMany({ data: rows, skipDuplicates: true });
    return result.count;
  } catch (err) {
    console.error(`[Greenhouse] ${company.slug}:`, (err as Error).message);
    return 0;
  }
}

export async function fetchFromGreenhouse(): Promise<number> {
  // All companies fetched in parallel — brings 40s serial down to ~3s
  const results = await Promise.allSettled(
    GREENHOUSE_COMPANIES.map((c) => fetchOneGreenhouse(c))
  );
  return results.reduce(
    (sum, r) => sum + (r.status === "fulfilled" ? r.value : 0),
    0
  );
}

// Run all sources in parallel and return total new jobs
export async function fetchAllSources(): Promise<{ total: number; breakdown: Record<string, number> }> {
  const [jsearch, adzuna, remotive, greenhouse, lever, workday] = await Promise.allSettled([
    fetchFromJSearch(),
    fetchFromAdzuna(),
    fetchFromRemotive(),
    fetchFromGreenhouse(),
    fetchFromLever(),
    fetchFromWorkday(),
  ]);

  const counts = {
    jsearch:    jsearch.status    === "fulfilled" ? jsearch.value    : 0,
    adzuna:     adzuna.status     === "fulfilled" ? adzuna.value     : 0,
    remotive:   remotive.status   === "fulfilled" ? remotive.value   : 0,
    greenhouse: greenhouse.status === "fulfilled" ? greenhouse.value : 0,
    lever:      lever.status      === "fulfilled" ? lever.value      : 0,
    workday:    workday.status    === "fulfilled" ? workday.value    : 0,
  };

  return {
    total: Object.values(counts).reduce((a, b) => a + b, 0),
    breakdown: counts,
  };
}

// ── Helpers ────────────────────────────────────────────────────────────────

function parseSalaryBound(salary: string | undefined, bound: "min" | "max"): number | null {
  if (!salary) return null;
  const matches = [...salary.matchAll(/[\d,]+/g)].map((m) => parseInt(m[0].replace(/,/g, "")));
  if (!matches.length) return null;
  return bound === "min" ? matches[0] : matches[matches.length - 1];
}

function extractSkillsFromTitle(title: string): string[] {
  const t = title.toLowerCase();
  const map: Record<string, string[]> = {
    react: ["React", "JavaScript", "TypeScript"],
    angular: ["Angular", "TypeScript"],
    vue: ["Vue.js", "JavaScript"],
    node: ["Node.js", "JavaScript"],
    python: ["Python"],
    java: ["Java", "Spring Boot"],
    golang: ["Go"],
    devops: ["Docker", "Kubernetes", "CI/CD"],
    aws: ["AWS", "Cloud"],
    gcp: ["GCP", "Cloud"],
    azure: ["Azure", "Cloud"],
    "machine learning": ["Python", "ML", "TensorFlow"],
    "data science": ["Python", "SQL", "ML"],
    "product manager": ["Product Roadmap", "Agile"],
    design: ["Figma", "UI/UX"],
    security: ["Security", "SIEM", "Penetration Testing"],
  };
  for (const [key, skills] of Object.entries(map)) {
    if (t.includes(key)) return skills;
  }
  return [];
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

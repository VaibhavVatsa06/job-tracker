export interface Job {
  id: string;
  title: string;
  company: string;
  logoDomain: string | null;
  companyType: CompanyType;
  location: string;
  city: string;
  country: string;
  lat: number | null;
  lng: number | null;
  minExp: number;
  maxExp: number;
  salaryMin: number | null;
  salaryMax: number | null;
  currency: string;
  jobType: JobType;
  industry: string;
  skills: string[];
  description: string;
  applyUrl: string;
  source: string;
  isActive: boolean;
  postedAt: string;
  createdAt: string;
}

export interface Application {
  id: string;
  jobId: string;
  name: string;
  email: string;
  phone?: string;
  resumeUrl?: string;
  coverLetter?: string;
  status: string;
  createdAt: string;
}

export type CompanyType = "MNC" | "Startup" | "IndianIT" | "MidSize" | "Government";
export type JobType = "Full-time" | "Part-time" | "Remote" | "Hybrid";

export interface JobFilters {
  search: string;
  minExp: number;
  maxExp: number;
  locations: string[];
  companyTypes: CompanyType[];
  jobTypes: JobType[];
  industries: string[];
  currency: string;
}

export interface JobStats {
  totalJobs: number;
  totalCompanies: number;
  totalCities: number;
  remoteJobs: number;
  todayJobs: number;
}

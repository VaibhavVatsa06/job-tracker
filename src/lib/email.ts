import { Resend } from "resend";
import type { Job } from "@/types";
import { formatSalary, expLabel } from "./utils";

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

export async function sendJobAlertEmail(
  to: string,
  keywords: string,
  jobs: Job[]
): Promise<boolean> {
  if (!resend) return false;
  if (jobs.length === 0) return false;

  const jobRows = jobs
    .slice(0, 8)
    .map(
      (j) => `
      <tr>
        <td style="padding:12px 0;border-bottom:1px solid #f1f5f9;">
          <a href="https://job-tracker-ten-chi.vercel.app/jobs/${j.id}"
             style="font-weight:600;color:#4f46e5;text-decoration:none;font-size:14px;">
            ${j.title}
          </a>
          <div style="color:#64748b;font-size:13px;margin-top:3px;">
            ${j.company} &bull; ${j.city} &bull; ${expLabel(j.minExp, j.maxExp)} exp
          </div>
          <div style="color:#10b981;font-size:13px;font-weight:500;margin-top:2px;">
            ${formatSalary(j.salaryMin, j.salaryMax, j.currency)}
          </div>
        </td>
        <td style="padding:12px 0 12px 16px;border-bottom:1px solid #f1f5f9;vertical-align:top;">
          <a href="https://job-tracker-ten-chi.vercel.app/jobs/${j.id}"
             style="display:inline-block;background:#4f46e5;color:white;padding:6px 14px;border-radius:8px;font-size:12px;font-weight:600;text-decoration:none;">
            View
          </a>
        </td>
      </tr>`
    )
    .join("");

  const html = `
    <!DOCTYPE html>
    <html>
    <body style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:#f8fafc;margin:0;padding:0;">
      <div style="max-width:560px;margin:32px auto;background:white;border-radius:16px;overflow:hidden;border:1px solid #e2e8f0;">
        <div style="background:linear-gradient(135deg,#4f46e5,#7c3aed);padding:28px 32px;">
          <div style="font-size:22px;font-weight:800;color:white;">💼 JobTracker Alert</div>
          <div style="color:#c7d2fe;margin-top:6px;font-size:14px;">
            ${jobs.length} new job${jobs.length > 1 ? "s" : ""} matching &ldquo;${keywords}&rdquo;
          </div>
        </div>
        <div style="padding:24px 32px;">
          <table style="width:100%;border-collapse:collapse;">
            ${jobRows}
          </table>
          ${jobs.length > 8 ? `<p style="text-align:center;color:#94a3b8;font-size:13px;margin-top:12px;">+${jobs.length - 8} more jobs on the site</p>` : ""}
        </div>
        <div style="padding:20px 32px;background:#f8fafc;border-top:1px solid #f1f5f9;text-align:center;">
          <a href="https://job-tracker-ten-chi.vercel.app/jobs?search=${encodeURIComponent(keywords)}"
             style="display:inline-block;background:#4f46e5;color:white;padding:10px 24px;border-radius:10px;font-weight:600;font-size:14px;text-decoration:none;">
            Browse All Jobs
          </a>
          <p style="color:#94a3b8;font-size:12px;margin-top:16px;">
            You&apos;re receiving this because you set up a job alert for &ldquo;${keywords}&rdquo;.<br/>
            <a href="https://job-tracker-ten-chi.vercel.app" style="color:#94a3b8;">JobTracker</a>
          </p>
        </div>
      </div>
    </body>
    </html>`;

  try {
    await resend.emails.send({
      from: "JobTracker <onboarding@resend.dev>",
      to,
      subject: `${jobs.length} new job${jobs.length > 1 ? "s" : ""} matching "${keywords}"`,
      html,
    });
    return true;
  } catch (err) {
    console.error("[email] Failed to send alert:", err);
    return false;
  }
}

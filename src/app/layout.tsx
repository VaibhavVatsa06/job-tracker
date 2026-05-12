import type { Metadata } from "next";
import "./globals.css";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Toaster } from "react-hot-toast";

export const metadata: Metadata = {
  title: "JobTracker – Find Your Next Role",
  description: "Discover curated job openings across India and remote, filtered by experience, location, and company type. Apply directly from the platform.",
  keywords: "jobs in India, software engineer jobs, bangalore jobs, remote jobs India, job openings 2024",
  openGraph: {
    title: "JobTracker – Find Your Next Role",
    description: "Curated job openings across India and remote",
    type: "website",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="flex flex-col min-h-screen">
        <Header />
        <main className="flex-1">{children}</main>
        <Footer />
        <Toaster position="bottom-right" toastOptions={{ style: { borderRadius: "10px", background: "#1e293b", color: "#f8fafc" } }} />
      </body>
    </html>
  );
}

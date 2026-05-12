import { Suspense } from "react";
import { JobsPageClient } from "./JobsPageClient";

export default function JobsPage() {
  return (
    <Suspense fallback={
      <div className="max-w-7xl mx-auto px-4 py-16 flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-primary-600 border-t-transparent rounded-full" />
      </div>
    }>
      <JobsPageClient />
    </Suspense>
  );
}

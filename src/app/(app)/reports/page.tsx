import { Metadata } from "next";
import { redirect } from "next/navigation";
import { ReportView } from "@/components/report-view";
import { getCurrentUser } from "@/lib/auth";
import { buildSummaryReport } from "@/lib/reports";

export const metadata: Metadata = { title: "Reports" };

export default async function ReportsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  const now = new Date();
  const range = {
    from: new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1))
      .toISOString()
      .slice(0, 10),
    to: now.toISOString().slice(0, 10),
  };
  const report = await buildSummaryReport(user.id, range);

  return <ReportView initialReport={report} />;
}

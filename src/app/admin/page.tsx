import type { Metadata } from "next";
import { AdminDashboard } from "@/components/admin-dashboard";
import { AdminLoginForm } from "@/components/admin-login-form";
import { InnerPageShell } from "@/components/inner-page-shell";
import { isAdminAuthenticated, isAdminConfigured } from "@/lib/admin/auth";
import { getAdminDashboardData } from "@/lib/db/admin-dashboard";
import { getAdminMarketsData } from "@/lib/db/markets";

export const metadata: Metadata = {
  title: "Admin",
  robots: {
    index: false,
    follow: false,
  },
};

export default async function AdminPage() {
  const authed = await isAdminAuthenticated();

  if (!authed) {
    return (
      <InnerPageShell centerMain mainClassName="px-4 py-10">
        <AdminLoginForm adminConfigured={isAdminConfigured()} />
      </InnerPageShell>
    );
  }

  const [data, marketsData] = await Promise.all([
    getAdminDashboardData(),
    getAdminMarketsData(),
  ]);

  return (
    <InnerPageShell mainClassName="px-4 py-8">
      <AdminDashboard data={data} marketsData={marketsData} />
    </InnerPageShell>
  );
}

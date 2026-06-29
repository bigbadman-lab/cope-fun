import type { Metadata } from "next";
import { AdminLoginForm } from "@/components/admin-login-form";
import { AdminPulseControlPanel } from "@/components/admin-pulse-control-panel";
import { InnerPageShell } from "@/components/inner-page-shell";
import { isAdminAuthenticated, isAdminConfigured } from "@/lib/admin/auth";

import { PULSE_BELIEF_ROOM_ID } from "@/lib/pulse/constants";

export const metadata: Metadata = {
  title: "Admin · Pulse",
  robots: {
    index: false,
    follow: false,
  },
};

export default async function AdminPulsePage() {
  const authed = await isAdminAuthenticated();

  if (!authed) {
    return (
      <InnerPageShell centerMain mainClassName="px-4 py-10">
        <AdminLoginForm adminConfigured={isAdminConfigured()} />
      </InnerPageShell>
    );
  }

  return (
    <InnerPageShell mainClassName="px-4 py-8">
      <AdminPulseControlPanel beliefRoomId={PULSE_BELIEF_ROOM_ID} />
    </InnerPageShell>
  );
}

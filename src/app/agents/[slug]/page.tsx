import { AgentProfilePage } from "@/components/agent-profile-page";

type AgentProfileRouteProps = {
  params: Promise<{ slug: string }>;
};

export default async function AgentProfileRoute({
  params,
}: AgentProfileRouteProps) {
  const { slug } = await params;
  return <AgentProfilePage slug={slug} />;
}

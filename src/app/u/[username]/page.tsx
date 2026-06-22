import { PublicProfilePage } from "@/components/public-profile-page";

type PublicProfileRouteProps = {
  params: Promise<{ username: string }>;
};

export default async function PublicProfileRoute({
  params,
}: PublicProfileRouteProps) {
  const { username } = await params;
  return <PublicProfilePage username={username} />;
}

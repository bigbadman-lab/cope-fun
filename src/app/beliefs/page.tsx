import { BeliefsDirectoryPage } from "@/components/beliefs-directory-page";
import {
  BELIEFS_PAGE_SIZE,
  listBeliefRooms,
} from "@/lib/db/beliefs-directory";

type BeliefsPageProps = {
  searchParams: Promise<{ page?: string }>;
};

function parsePageParam(value: string | undefined): number {
  const parsed = Number.parseInt(value ?? "1", 10);
  if (!Number.isFinite(parsed) || parsed < 1) return 1;
  return parsed;
}

export default async function Beliefs({ searchParams }: BeliefsPageProps) {
  const { page: pageParam } = await searchParams;
  const directory = await listBeliefRooms({
    page: parsePageParam(pageParam),
    pageSize: BELIEFS_PAGE_SIZE,
  });

  return <BeliefsDirectoryPage {...directory} />;
}

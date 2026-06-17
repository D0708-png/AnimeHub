import type { Metadata } from "next";
import { AdminEpisodeListPage } from "@/components/admin/AdminEpisodeListPage";

interface AdminEpisodeListRouteProps {
  params: Promise<{
    id: string;
  }>;
}

export const metadata: Metadata = {
  title: "Admin Episodes"
};

export default async function AdminEpisodeListRoute({ params }: AdminEpisodeListRouteProps) {
  const { id } = await params;

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <AdminEpisodeListPage animeId={decodeURIComponent(id)} />
    </div>
  );
}

import type { Metadata } from "next";
import { AdminEpisodeEditPage } from "@/components/admin/AdminEpisodeEditPage";

interface NewAdminEpisodePageProps {
  params: Promise<{
    id: string;
  }>;
}

export const metadata: Metadata = {
  title: "New Episode"
};

export default async function NewAdminEpisodePage({ params }: NewAdminEpisodePageProps) {
  const { id } = await params;

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <AdminEpisodeEditPage animeId={decodeURIComponent(id)} />
    </div>
  );
}

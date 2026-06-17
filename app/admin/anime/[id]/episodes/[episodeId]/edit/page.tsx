import type { Metadata } from "next";
import { AdminEpisodeEditPage } from "@/components/admin/AdminEpisodeEditPage";

interface EditAdminEpisodePageProps {
  params: Promise<{
    id: string;
    episodeId: string;
  }>;
}

export const metadata: Metadata = {
  title: "Edit Episode"
};

export default async function EditAdminEpisodePage({ params }: EditAdminEpisodePageProps) {
  const { id, episodeId } = await params;

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <AdminEpisodeEditPage
        animeId={decodeURIComponent(id)}
        episodeId={decodeURIComponent(episodeId)}
      />
    </div>
  );
}

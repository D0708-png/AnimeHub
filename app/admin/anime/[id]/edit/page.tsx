import type { Metadata } from "next";
import { AdminAnimeEditPage } from "@/components/admin/AdminAnimeEditPage";

interface EditAdminAnimePageProps {
  params: Promise<{
    id: string;
  }>;
}

export const metadata: Metadata = {
  title: "Edit Anime"
};

export default async function EditAdminAnimePage({ params }: EditAdminAnimePageProps) {
  const { id } = await params;

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <AdminAnimeEditPage animeId={decodeURIComponent(id)} />
    </div>
  );
}

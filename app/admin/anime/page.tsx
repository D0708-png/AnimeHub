import type { Metadata } from "next";
import { AdminAnimeListPage } from "@/components/admin/AdminAnimeListPage";

export const metadata: Metadata = {
  title: "Admin Anime"
};

export default function AdminAnimePage() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <AdminAnimeListPage />
    </div>
  );
}

import type { Metadata } from "next";
import { AdminAnimeEditPage } from "@/components/admin/AdminAnimeEditPage";

export const metadata: Metadata = {
  title: "New Anime"
};

export default function NewAdminAnimePage() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <AdminAnimeEditPage />
    </div>
  );
}

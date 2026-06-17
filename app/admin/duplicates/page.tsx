import type { Metadata } from "next";
import { AdminDuplicatesPage } from "@/components/admin/AdminDuplicatesPage";

export const metadata: Metadata = {
  title: "Admin Duplicate Check"
};

export default function AdminDuplicatesRoute() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <AdminDuplicatesPage />
    </div>
  );
}

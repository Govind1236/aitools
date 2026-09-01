import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { AdminSidebar } from "@/components/admin/admin-sidebar";

export const dynamic = "force-dynamic";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/admin/login");
  }

  return (
    <div className="flex min-h-[calc(100vh-64px)]">
      <AdminSidebar />
      <div className="flex-1 p-6 md:p-8 bg-gray-50 overflow-auto">{children}</div>
    </div>
  );
}

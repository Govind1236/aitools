import { AdminToolsClient } from "./admin-tools-client";
import { getAdminTools } from "@/lib/payload/admin";

export const dynamic = "force-dynamic";

export default async function AdminToolsPage() {
  const { tools, providers, tags } = await getAdminTools();

  return <AdminToolsClient tools={tools as any} providers={providers} tags={tags} />;
}
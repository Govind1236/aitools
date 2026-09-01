import { Header } from "@/components/ui/header";
import { getActiveCategories } from "@/lib/queries/categories";

export async function HeaderWithCategories() {
  const categories = await getActiveCategories();
  return <Header categories={categories} />;
}

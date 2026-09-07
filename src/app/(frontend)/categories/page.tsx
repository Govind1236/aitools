import { CategoryCard } from "@/components/tools/category-card";
import { Metadata } from "next";
import { Grid3X3 } from "lucide-react";
import { getActiveCategories } from "@/lib/queries/categories";

export const metadata: Metadata = {
  title: "AI Tool Categories",
  description:
    "Browse all AI tool categories — writing, coding, image, video, audio, research, productivity, marketing, design, automation, agents, models, and more.",
};

export default async function CategoriesPage() {
  // Only surface categories that contain at least one published tool.
  const categories = await getActiveCategories();

  const totalTools = categories.reduce(
    (sum, cat) => sum + (cat._count?.tools || 0),
    0
  );

  return (
    <div className="max-w-[1200px] mx-auto px-5 md:px-6 py-8 md:py-10">
      <div className="mb-10">
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-muted border border-border rounded-full text-[12px] text-muted-foreground mb-4 dark:bg-muted dark:border-border dark:text-muted-foreground">
          <Grid3X3 className="w-3.5 h-3.5" />
          {categories.length} categories
        </div>
        <h1 className="text-[30px] md:text-[38px] font-bold text-foreground tracking-tight">
          AI Tool Categories
        </h1>
        <p className="text-[16px] text-muted-foreground mt-2 max-w-xl leading-relaxed dark:text-muted-foreground">
          Explore our curated categories to find the perfect AI tool for your
          specific needs.{" "}
          <span className="font-medium text-foreground">{totalTools} tools</span>{" "}
          across all categories.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
        {categories.map((category) => (
          <CategoryCard
            key={category.id}
            category={category}
            showDescription
          />
        ))}
      </div>
    </div>
  );
}

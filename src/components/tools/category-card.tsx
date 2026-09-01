import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Category } from "@prisma/client";
import { getCategoryMeta } from "@/lib/category-config";

interface CategoryCardProps {
  category: Category & { _count?: { tools: number } };
  showDescription?: boolean;
}

export function CategoryCard({
  category,
  showDescription = false,
}: CategoryCardProps) {
  const meta = getCategoryMeta(category.slug);
  const Icon = meta.icon;

  return (
    <Link
      href={`/categories/${category.slug}`}
      className="group flex items-center justify-between gap-3 bg-background rounded-[14px] border border-border p-4 hover:border-[#0071e3]/40 hover:shadow-[0_12px_28px_rgba(0,0,0,0.08),0_0_12px_rgba(0,113,227,0.08)] hover:-translate-y-0.5 transition-all duration-300 shimmer"
    >
      <div className="flex items-center gap-3.5 min-w-0">
        <div
          className={`w-10 h-10 rounded-lg flex items-center justify-center border transition-all duration-200 group-hover:scale-110 group-hover:rotate-3 shrink-0 ${meta.bg} ${meta.color}`}
        >
          <Icon className="w-5 h-5" strokeWidth={1.5} />
        </div>
        <div className="min-w-0">
          <h3 className="text-[14px] font-semibold text-foreground group-hover:text-[#0071e3] dark:group-hover:text-[#2997ff] transition-colors duration-150 truncate">
            {category.name}
          </h3>
          {showDescription && category.description ? (
            <p className="text-[11.5px] text-muted-foreground mt-0.5 leading-snug line-clamp-1">
              {category.description}
            </p>
          ) : (
            category._count !== undefined && (
              <p className="text-[11.5px] text-muted-foreground mt-0.5 font-medium">
                {category._count.tools} tool
                {category._count.tools !== 1 ? "s" : ""}
              </p>
            )
          )}
        </div>
      </div>
      <ArrowRight
        className="w-4 h-4 text-muted-foreground/50 group-hover:text-foreground transition-all duration-200 group-hover:translate-x-0.5 shrink-0"
        strokeWidth={1.5}
      />
    </Link>
  );
}

import { notFound } from "next/navigation";
import { Metadata } from "next";
import Link from "next/link";
import { ToolCard } from "@/components/tools/tool-card";
import { getCategoryMeta } from "@/lib/category-config";
import { EntityType, ATTRIBUTES } from "@/lib/constants";
import { buildToolWhere } from "@/lib/tool-query";
import {
  ChevronRight,
  Search,
  Sparkles,
  SlidersHorizontal,
  X,
} from "lucide-react";
import { getActiveCategories } from "@/lib/queries/categories";
import { getToolsDirectory } from "@/lib/queries/tools";
import { getCatalogRepository } from "@/lib/catalog";

interface CategoryPageProps {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{
    entityType?: string;
    pricing?: string;
    attributes?: string | string[];
  }>;
}

export async function generateMetadata({
  params,
}: CategoryPageProps): Promise<Metadata> {
  const { slug } = await params;
  const category = await getCatalogRepository().findCategoryBySlug(slug);

  if (!category) return { title: "Category Not Found" };

  return {
    title: `${category.name} AI Tools (${new Date().getFullYear()})`,
    description:
      category.description ||
      `Discover the best ${category.name} AI tools. Browse and compare top-rated ${category.name} tools.`,
  };
}

export default async function CategoryPage({
  params,
  searchParams,
}: CategoryPageProps) {
  const { slug } = await params;
  const filters = await searchParams;

  const category = await getCatalogRepository().findCategoryBySlug(slug);

  if (!category) notFound();

  const entityType = filters.entityType || "";
  const pricing = filters.pricing || "";
  const attributeParam = filters.attributes;
  const selectedAttrs = Array.isArray(attributeParam)
    ? attributeParam
    : attributeParam
    ? [attributeParam]
    : [];

  // Build the filter condition for this category's tools using the shared
  // query builder. It applies entityType, pricing, and attribute filters in
  // exactly the same way as the tools directory and API routes.
  const where = await buildToolWhere({
    categorySlug: category.slug,
    pricing,
    entityType,
    attributes: selectedAttrs,
  });

  const [tools, visibleCategories] = await Promise.all([
    getToolsDirectory(where),
    getActiveCategories(),
  ]);

  // Categories with no published tools are not surfaced publicly. Any filters
  // are applied on top, so this only checks the base emptiness of the category.
  // Categories with no published tools are not surfaced publicly.
  if (!visibleCategories.some((c) => c.id === category.id)) notFound();

  const meta = getCategoryMeta(category.slug);
  const Icon = meta.icon;

  const makeHref = (patch: Record<string, string>) => {
    const params = new URLSearchParams();
    const next = { ...filters, ...patch };
    for (const [k, v] of Object.entries(next)) {
      if (Array.isArray(v)) v.forEach((x) => params.append(k, x));
      else if (v) params.set(k, v);
    }
    const qs = params.toString();
    return `/categories/${category.slug}${qs ? `?${qs}` : ""}`;
  };

  const toggleAttr = (id: string) => {
    const next = selectedAttrs.includes(id)
      ? selectedAttrs.filter((a) => a !== id)
      : [...selectedAttrs, id];
    const params = new URLSearchParams();
    if (entityType) params.set("entityType", entityType);
    if (pricing) params.set("pricing", pricing);
    next.forEach((a) => params.append("attributes", a));
    return `/categories/${category.slug}${params.toString() ? `?${params.toString()}` : ""}`;
  };

  return (
    <div className="max-w-[1200px] mx-auto px-5 md:px-6 py-8 md:py-10">
      {/* Breadcrumb */}
      <nav
        className="flex items-center gap-1.5 text-[12px] text-slate-400 dark:text-muted-foreground mb-6"
        aria-label="Breadcrumb"
      >
        <Link href="/" className="hover:text-slate-700 transition-colors dark:hover:text-slate-300">
          Home
        </Link>
        <ChevronRight className="w-3 h-3" strokeWidth={1.5} />
        <Link
          href="/categories"
          className="hover:text-slate-700 transition-colors dark:hover:text-slate-300"
        >
          Categories
        </Link>
        <ChevronRight className="w-3 h-3" strokeWidth={1.5} />
        <span className="text-slate-700 font-medium dark:text-slate-300">{category.name}</span>
      </nav>

      {/* Header Banner */}
      <div className="bg-background rounded-2xl border border-border p-6 md:p-8 mb-8 shadow-xs dark:bg-muted">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div
              className={`w-14 h-14 rounded-2xl ${meta.bg.replace(/\s*\S*group-hover:\S*/g, "")} ${meta.color} border flex items-center justify-center shadow-sm shrink-0`}
            >
              <Icon className="w-7 h-7" strokeWidth={1.5} />
            </div>
            <div>
              <h1 className="text-[30px] md:text-[36px] font-bold text-foreground tracking-tight leading-tight">
                {category.name} AI Tools
              </h1>
              <p className="text-[14px] text-muted-foreground font-medium mt-1.5">
                {tools.length} active AI {tools.length === 1 ? "tool" : "tools"} in this category
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href="/tools"
              className="text-[13px] font-medium text-slate-600 hover:text-foreground bg-slate-50 hover:bg-slate-100 border border-slate-200 px-3.5 py-2 rounded-xl transition-colors dark:text-slate-300 dark:bg-accent dark:hover:bg-accent-hover dark:border-border"
            >
              Browse All Tools
            </Link>
          </div>
        </div>

        {category.description && (
          <p className="text-[14px] text-slate-600 mt-4 pt-4 border-t border-border leading-relaxed max-w-3xl dark:text-slate-400">
            {category.description}
          </p>
        )}

        {/* Relevant filters */}
        <div className="flex flex-wrap items-center gap-2 mt-6 pt-4 border-t border-border">
          <span className="text-[12px] font-medium text-slate-400 mr-1 flex items-center gap-1 dark:text-muted-foreground">
            <SlidersHorizontal className="w-3 h-3" />
            Filters:
          </span>

          {/* Entity type */}
          <Link
            href={entityType ? makeHref({ entityType: "" }) : makeHref({ entityType: "TOOL" })}
            className={`px-3 py-1 rounded-lg text-[12px] font-medium border transition-all ${
              entityType === "TOOL"
                ? "bg-primary text-primary-foreground border-primary"
                : "bg-slate-50 text-slate-600 border-slate-200/60 hover:bg-slate-100 dark:bg-muted dark:text-slate-300 dark:border-border dark:hover:bg-accent"
            }`}
            title="Tools"
          >
            All
          </Link>
          {(Object.keys(EntityType) as (keyof typeof EntityType)[]).map((key) => (
            <Link
              key={key}
              href={
                entityType === EntityType[key]
                  ? makeHref({ entityType: "" })
                  : makeHref({ entityType: EntityType[key] })
              }
              className={`px-3 py-1 rounded-lg text-[12px] font-medium border transition-all ${
                entityType === EntityType[key]
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-slate-50 text-slate-600 border-slate-200/60 hover:bg-slate-100 dark:bg-muted dark:text-slate-300 dark:border-border dark:hover:bg-accent"
              }`}
            >
              {EntityType[key].charAt(0) + EntityType[key].slice(1).toLowerCase()}
            </Link>
          ))}

          <span className="w-px h-5 bg-slate-200 mx-1 dark:bg-border" />

          {/* Attribute filters */}
          {ATTRIBUTES.map((attr) => {
            const active = selectedAttrs.includes(attr.id);
            return (
              <Link
                key={attr.id}
                href={toggleAttr(attr.id)}
                title={attr.description}
                className={`px-3 py-1 rounded-lg text-[12px] font-medium border transition-all ${
                  active
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-slate-50 text-slate-600 border-slate-200/60 hover:bg-slate-100 dark:bg-muted dark:text-slate-300 dark:border-border dark:hover:bg-accent"
                }`}
              >
                {attr.label}
              </Link>
            );
          })}

          {(entityType || pricing || selectedAttrs.length > 0) && (
            <Link
              href={`/categories/${category.slug}`}
              className="inline-flex items-center gap-1 text-[12px] font-semibold text-rose-600 hover:text-rose-700 bg-rose-50 border border-rose-100 px-3 py-1 rounded-lg transition-colors dark:text-rose-400 dark:hover:text-rose-300 dark:bg-rose-500/10 dark:border-rose-500/30"
            >
              <X className="w-3 h-3" />
              Clear
            </Link>
          )}
        </div>
      </div>

      {/* Other Categories Pill Nav (active only) */}
      <div className="flex items-center gap-2 overflow-x-auto pb-4 mb-8 scrollbar-none">
        {visibleCategories.map((c) => (
          <Link
            key={c.id}
            href={`/categories/${c.slug}`}
            className={`whitespace-nowrap px-3.5 py-1.5 rounded-xl text-[12.5px] font-medium transition-all duration-150 border shrink-0 ${
              c.slug === category.slug
                ? "bg-primary text-primary-foreground border-primary shadow-xs"
                : "bg-background text-slate-600 hover:bg-slate-50 border-slate-200/80 hover:border-slate-300 dark:text-slate-300 dark:hover:bg-muted dark:border-border dark:hover:border-border-hover"
            }`}
          >
            {c.name}
            {c._count && (
              <span className="ml-1.5 opacity-60 text-[11px]">
                ({c._count.tools})
              </span>
            )}
          </Link>
        ))}
      </div>

      {/* Tool Grid */}
      {tools.length === 0 ? (
        <div className="text-center py-20 bg-background rounded-2xl border border-border">
          <div className="w-14 h-14 rounded-xl bg-muted flex items-center justify-center mx-auto mb-4">
            <Search className="w-6 h-6 text-slate-300 dark:text-slate-600" strokeWidth={1.5} />
          </div>
          <h2 className="text-[16px] font-semibold text-foreground mb-1.5">
            No tools match these filters
          </h2>
          <p className="text-[13px] text-muted-foreground leading-relaxed max-w-sm mx-auto mb-5">
            Try a different combination of filters, or browse all tools.
          </p>
          <Link
            href={`/categories/${category.slug}`}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-primary text-primary-foreground text-[13px] font-medium rounded-xl hover:bg-primary-hover hover:shadow-md transition-all"
          >
            <Sparkles className="w-3.5 h-3.5" />
            Reset filters
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {tools.map((tool) => (
            <ToolCard key={tool.id} tool={tool} />
          ))}
        </div>
      )}
    </div>
  );
}

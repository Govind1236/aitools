import Link from "next/link";
import { ArrowRight, Sparkles, Zap, Layers, Cpu } from "lucide-react";
import { ToolCard } from "@/components/tools/tool-card";
import { SearchBar } from "@/components/tools/search-bar";
import { FloatingAIApps } from "@/components/ui/floating-ai-apps";
import { LogoMarquee } from "@/components/ui/logo-marquee";
import { ScrollReveal } from "@/components/ui/scroll-reveal";
import { AnimatedCounter } from "@/components/ui/animated-counter";
import { getPopularSearches } from "@/lib/searches";
import {
  getPublishedToolCount,
  getVerifiedToolCount,
  getTrendingTools,
  getRecentTools,
  getFreeTools,
} from "@/lib/queries/tools";
import { getActiveCategories } from "@/lib/queries/categories";

async function safeArray<T>(promise: Promise<T[]>): Promise<T[]> {
  try {
    return await promise;
  } catch (error) {
    console.warn(
      "[home] Database unavailable during build; using empty list.",
      error instanceof Error ? error.message : error,
    );
    return [];
  }
}

async function safeCount(promise: Promise<number>): Promise<number> {
  try {
    return await promise;
  } catch {
    return 0;
  }
}

export default async function HomePage() {
  const [
    activeCategories,
    trendingTools,
    recentTools,
    freeTools,
    totalTools,
    verifiedTools,
    popularSearches,
  ] = await Promise.all([
    // Categories that contain at least one published tool. Counts are
    // database-driven via the included `_count`.
    safeArray(getActiveCategories()),
    // Trending is currently derived from the featured system until a real
    // analytics-based trendingScore exists (see docs).
    safeArray(getTrendingTools(4)),
    safeArray(getRecentTools(3)),
    safeArray(getFreeTools(3)),
    safeCount(getPublishedToolCount()),
    safeCount(getVerifiedToolCount()),
    safeArray(getPopularSearches(5)),
  ]);

  const verifiedPercent =
    totalTools > 0 ? Math.round((verifiedTools / totalTools) * 100) : 0;

  return (
    <div className="min-h-screen bg-background text-foreground transition-colors duration-300">
      {/* Hero Search with animated tech effects */}
      <section className="relative px-5 md:px-6 pt-24 pb-20 md:pt-36 md:pb-28 hero-gradient border-b border-border overflow-hidden">
        {/* Tech grid overlay */}
        <div className="absolute inset-0 tech-grid opacity-60 pointer-events-none" />
        
        {/* Animated pulsing glow orbs */}
        <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] rounded-full pointer-events-none"
          style={{
            background: "radial-gradient(circle, rgba(0,113,227,0.06), transparent 70%)",
            animation: "orbFloat1 12s ease-in-out infinite",
          }}
        />
        <div className="absolute top-1/2 right-1/4 w-[400px] h-[400px] rounded-full pointer-events-none"
          style={{
            background: "radial-gradient(circle, rgba(175,82,222,0.05), transparent 70%)",
            animation: "orbFloat2 14s ease-in-out infinite",
          }}
        />
        <div className="absolute bottom-0 left-1/2 w-[300px] h-[300px] rounded-full pointer-events-none"
          style={{
            background: "radial-gradient(circle, rgba(88,86,214,0.04), transparent 70%)",
            animation: "orbFloat3 16s ease-in-out infinite",
          }}
        />
        
        <FloatingAIApps />
        <div className="animate-fade-in-up relative max-w-[820px] mx-auto text-center">
          <ScrollReveal variant="up" delay={1}>
            <p className="text-[15px] md:text-[16px] font-semibold text-[#0071e3] mb-5 flex items-center justify-center gap-2">
              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-[#0071e3]/10 border border-[#0071e3]/20 text-[#0071e3] text-[12px] font-semibold badge-shine">
                <Zap className="w-3 h-3" />
                AI POWERED DIRECTORY
              </span>
            </p>
          </ScrollReveal>
          
          <ScrollReveal variant="up" delay={2}>
            <h1 className="text-[40px] md:text-[56px] lg:text-[64px] font-bold text-foreground tracking-tight leading-[1.05] mb-6">
              Find the right <span className="gradient-text">AI tool</span> for the job.
            </h1>
          </ScrollReveal>
          
          <ScrollReveal variant="up" delay={3}>
            <p className="text-[17px] md:text-[20px] text-muted-foreground mb-10 max-w-xl mx-auto leading-relaxed">
              Search and discover verified AI tools, models, agents, and APIs for your next project.
            </p>
          </ScrollReveal>

          <ScrollReveal variant="scale" delay={4}>
            <SearchBar
              totalTools={totalTools}
              popularTerms={popularSearches.map((s) => s.query)}
            />
          </ScrollReveal>

      {/* Popular Searches */}
      <ScrollReveal variant="up" delay={5}>
        <div className="mt-8">
          <p className="text-[13px] font-medium text-muted-foreground mb-3">Popular searches</p>
          <div className="flex flex-wrap items-center justify-center gap-2">
            {popularSearches.map((search) => (
              <Link
                key={search.query}
                href={`/tools?q=${encodeURIComponent(search.query)}`}
                className="px-3.5 py-1.5 rounded-full bg-background border border-border text-[13px] text-foreground/75 hover:text-foreground hover:border-[#0071e3]/50 hover:shadow-[0_0_15px_rgba(0,113,227,0.1)] hover:translate-y-[-1px] transition-all duration-200 tag-glow"
              >
                {search.query}
              </Link>
            ))}
          </div>
        </div>
      </ScrollReveal>

          {/* Animated stats */}
          <ScrollReveal variant="up" delay={6}>
            <div className="mt-12 flex items-center justify-center gap-8 md:gap-12">
              <div className="text-center">
                <div className="text-[28px] md:text-[32px] font-bold text-foreground">
                  <AnimatedCounter value={totalTools} className="gradient-text-subtle" />
                </div>
                <p className="text-[12px] text-muted-foreground mt-1">AI Tools</p>
              </div>
              <div className="w-px h-10 bg-border" />
              <div className="text-center">
                <div className="text-[28px] md:text-[32px] font-bold text-foreground">
                  <AnimatedCounter value={activeCategories.length} className="gradient-text-subtle" />
                </div>
                <p className="text-[12px] text-muted-foreground mt-1">Categories</p>
              </div>
              <div className="w-px h-10 bg-border" />
              <div className="text-center">
                <div className="text-[28px] md:text-[32px] font-bold text-foreground">
                  <AnimatedCounter value={verifiedPercent} suffix="%" className="gradient-text-subtle" />
                </div>
                <p className="text-[12px] text-muted-foreground mt-1">Verified</p>
              </div>
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* Trusted-by logo marquee */}
      <LogoMarquee />

      {/* Trending AI Tools */}
      {trendingTools.length > 0 && (
        <section className="max-w-[1200px] mx-auto px-5 md:px-6 py-20 md:py-24 border-b border-border">
          <ScrollReveal variant="up">
            <div className="flex items-end justify-between mb-10">
              <h2 className="text-[28px] md:text-[34px] font-bold text-foreground tracking-tight flex items-center gap-2.5">
                <span className="inline-flex w-8 h-8 items-center justify-center rounded-lg bg-[#0071e3]/10 text-[#0071e3]">
                  <Zap className="w-4 h-4" />
                </span>
                Trending <span className="gradient-text">AI Tools</span>
              </h2>
              <Link
                href="/tools"
                className="inline-flex items-center gap-1.5 text-[15px] font-medium text-[#0071e3] hover:text-[#0077ed] transition-all group"
              >
                View all
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>
          </ScrollReveal>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {trendingTools.map((tool, i) => (
              <ScrollReveal key={tool.id} variant="up" stagger delay={i + 1}>
                <ToolCard tool={tool} />
              </ScrollReveal>
            ))}
          </div>
        </section>
      )}

      {/* Explore AI by Category */}
        <section className="bg-muted border-b border-border relative overflow-hidden">
          <div className="absolute inset-0 tech-grid opacity-40 pointer-events-none" />
          <div className="relative max-w-[1200px] mx-auto px-5 md:px-6 py-20 md:py-24">
          <ScrollReveal variant="up">
            <div className="text-center mb-12">
              <h2 className="text-[28px] md:text-[34px] font-bold text-foreground tracking-tight flex items-center justify-center gap-2.5">
                <span className="inline-flex w-8 h-8 items-center justify-center rounded-lg bg-[#5856d6]/10 text-[#5856d6]">
                  <Layers className="w-4 h-4" />
                </span>
                Explore AI <span className="gradient-text">by category</span>
              </h2>
              <p className="text-[16px] text-muted-foreground mt-2">
                Browse tools across every category of creativity and productivity.
              </p>
            </div>
          </ScrollReveal>
          <div className="flex flex-wrap items-center justify-center gap-3 md:gap-4 max-w-4xl mx-auto">
            {activeCategories.map((category, i) => (
              <ScrollReveal key={category.id} variant="scale" stagger delay={Math.min(i, 5) + 1}>
                <Link
                  href={`/tools?category=${category.slug}`}
                  className="px-4 py-2 bg-background border border-border rounded-full text-[14px] md:text-[15px] font-medium text-foreground/75 hover:text-foreground hover:border-[#0071e3]/50 hover:shadow-[0_0_20px_rgba(0,113,227,0.15)] hover:translate-y-[-1px] transition-all duration-200 tag-glow"
                >
                  {category.name}
                  <span className="ml-1.5 text-[12px] text-muted-foreground">
                    {category._count?.tools}
                  </span>
                </Link>
              </ScrollReveal>
            ))}
          </div>
          <ScrollReveal variant="up" delay={2}>
            <div className="text-center mt-8">
              <Link
                href="/categories"
                className="inline-flex items-center gap-1.5 text-[15px] font-medium text-[#0071e3] hover:text-[#0077ed] transition-colors group"
              >
                View all categories
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* Recently Added */}
      {recentTools.length > 0 && (
        <section className="max-w-[1200px] mx-auto px-5 md:px-6 py-20 md:py-24 border-b border-border">
          <ScrollReveal variant="up">
            <div className="flex items-end justify-between mb-10">
              <h2 className="text-[28px] md:text-[34px] font-bold text-foreground tracking-tight flex items-center gap-2.5">
                <span className="inline-flex w-8 h-8 items-center justify-center rounded-lg bg-[#10b981]/10 text-[#10b981]">
                  <Zap className="w-4 h-4" />
                </span>
                Recently <span className="gradient-text">Added</span>
              </h2>
              <Link
                href="/tools"
                className="inline-flex items-center gap-1.5 text-[15px] font-medium text-[#0071e3] hover:text-[#0077ed] transition-all group"
              >
                View all
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>
          </ScrollReveal>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {recentTools.map((tool, i) => (
              <ScrollReveal key={tool.id} variant="up" stagger delay={i + 1}>
                <ToolCard tool={tool} />
              </ScrollReveal>
            ))}
          </div>
        </section>
      )}

      {/* Free AI Tools */}
      {freeTools.length > 0 && (
        <section className="max-w-[1200px] mx-auto px-5 md:px-6 py-20 md:py-24 border-b border-border">
          <ScrollReveal variant="up">
            <div className="flex items-end justify-between mb-10">
              <h2 className="text-[28px] md:text-[34px] font-bold text-foreground tracking-tight flex items-center gap-2.5">
                <span className="inline-flex w-8 h-8 items-center justify-center rounded-lg bg-[#10b981]/10 text-[#10b981]">
                  <Sparkles className="w-4 h-4" />
                </span>
                Free <span className="gradient-text">AI Tools</span>
              </h2>
              <Link
                href="/tools?pricing=free"
                className="inline-flex items-center gap-1.5 text-[15px] font-medium text-[#0071e3] hover:text-[#0077ed] transition-all group"
              >
                View all
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>
          </ScrollReveal>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {freeTools.map((tool, i) => (
              <ScrollReveal key={tool.id} variant="up" stagger delay={i + 1}>
                <ToolCard tool={tool} />
              </ScrollReveal>
            ))}
          </div>
        </section>
      )}

      {/* Discover Entities */}
      <section className="bg-muted relative overflow-hidden">
        <div className="absolute inset-0 tech-grid opacity-40 pointer-events-none" />
        <div className="relative max-w-[1200px] mx-auto px-5 md:px-6 py-20 md:py-24">
          <ScrollReveal variant="up">
            <div className="text-center mb-12">
              <h2 className="text-[28px] md:text-[34px] font-bold text-foreground tracking-tight flex items-center justify-center gap-2.5">
                <span className="inline-flex w-8 h-8 items-center justify-center rounded-lg bg-[#af52de]/10 text-[#af52de]">
                  <Cpu className="w-4 h-4" />
                </span>
                Discover more <span className="gradient-text">than tools</span>
              </h2>
              <p className="text-[16px] text-muted-foreground mt-2">
                Explore models, agents, and APIs built on the latest AI technology.
              </p>
            </div>
          </ScrollReveal>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <ScrollReveal variant="left" delay={1}>
              <div className="bg-background rounded-[18px] border border-border p-8 flex flex-col items-center text-center hover:shadow-[0_16px_40px_rgba(0,0,0,0.08)] hover:border-[#0071e3]/40 hover:-translate-y-1 transition-all duration-300 card-glow shimmer">
                <div className="w-14 h-14 rounded-2xl bg-[#0071e3]/10 flex items-center justify-center text-[#0071e3] mb-5">
                  <Cpu className="w-6 h-6" strokeWidth={1.5} />
                </div>
                <h3 className="text-[20px] font-bold tracking-tight mb-3 text-foreground">AI Models</h3>
                <p className="text-[14px] text-muted-foreground mb-6 max-w-xs leading-relaxed">
                  Explore foundation models, open-weights, and local LLMs.
                </p>
                <Link href="/tools?entityType=MODEL" className="inline-flex items-center text-[15px] font-medium text-[#0071e3] hover:text-[#0077ed] group">
                  Browse Models <ArrowRight className="ml-1.5 w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </Link>
              </div>
            </ScrollReveal>

            <ScrollReveal variant="up" delay={2}>
              <div className="bg-background rounded-[18px] border border-border p-8 flex flex-col items-center text-center hover:shadow-[0_16px_40px_rgba(0,0,0,0.08)] hover:border-[#5856d6]/40 hover:-translate-y-1 transition-all duration-300 card-glow shimmer">
                <div className="w-14 h-14 rounded-2xl bg-[#5856d6]/10 flex items-center justify-center text-[#5856d6] mb-5">
                  <Zap className="w-6 h-6" strokeWidth={1.5} />
                </div>
                <h3 className="text-[20px] font-bold tracking-tight mb-3 text-foreground">AI Agents</h3>
                <p className="text-[14px] text-muted-foreground mb-6 max-w-xs leading-relaxed">
                  Find autonomous agents for coding, research, and daily workflows.
                </p>
                <Link href="/tools?entityType=AGENT" className="inline-flex items-center text-[15px] font-medium text-[#5856d6] hover:text-[#5e5ce6] group">
                  Browse Agents <ArrowRight className="ml-1.5 w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </Link>
              </div>
            </ScrollReveal>

            <ScrollReveal variant="right" delay={3}>
              <div className="bg-background rounded-[18px] border border-border p-8 flex flex-col items-center text-center hover:shadow-[0_16px_40px_rgba(0,0,0,0.08)] hover:border-[#af52de]/40 hover:-translate-y-1 transition-all duration-300 card-glow shimmer">
                <div className="w-14 h-14 rounded-2xl bg-[#af52de]/10 flex items-center justify-center text-[#af52de] mb-5">
                  <Layers className="w-6 h-6" strokeWidth={1.5} />
                </div>
                <h3 className="text-[20px] font-bold tracking-tight mb-3 text-foreground">AI APIs</h3>
                <p className="text-[14px] text-muted-foreground mb-6 max-w-xs leading-relaxed">
                  Integrate powerful AI capabilities into your applications.
                </p>
                <Link href="/tools?entityType=API" className="inline-flex items-center text-[15px] font-medium text-[#af52de] hover:text-[#bf5af2] group">
                  Browse APIs <ArrowRight className="ml-1.5 w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </Link>
              </div>
            </ScrollReveal>
          </div>
        </div>
      </section>
    </div>
  );
}

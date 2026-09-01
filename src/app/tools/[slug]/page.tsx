import { notFound } from "next/navigation";
import { Metadata } from "next";
import Link from "next/link";
import ReactMarkdown from "react-markdown";
import {
  ExternalLink,
  ArrowRight,
  ChevronRight,
  ShieldCheck,
  ShieldAlert,
  ShieldQuestion,
  Globe,
  Layers,
  Clock,
  Server
} from "lucide-react";
import { ToolCard } from "@/components/tools/tool-card";
import { VerificationStatus, getVerificationLabel } from "@/lib/constants";
import { getToolLogoSrc } from "@/lib/logo";
import { getPricingConfig } from "@/lib/pricing";
import {
  getToolBySlug,
  getToolAlternatives,
} from "@/lib/queries/tools";

interface ToolPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({
  params,
}: ToolPageProps): Promise<Metadata> {
  const { slug } = await params;
  const tool = await getToolBySlug(slug);

  if (!tool) return { title: "Tool Not Found" };

  return {
    title: `${tool.name} — Review, Pricing & Features`,
    description: tool.description,
    openGraph: {
      title: `${tool.name} — AI Tools Directory`,
      description: tool.description,
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: `${tool.name} — AI Tools Directory`,
      description: tool.description,
    },
  };
}

export default async function ToolPage({ params }: ToolPageProps) {
  const { slug } = await params;

  const tool = await getToolBySlug(slug);

  if (!tool) notFound();

  // Alternatives / Related Tools
  const alternatives = await getToolAlternatives(tool.categoryId, tool.id);

  const pricing = getPricingConfig(tool.pricingType);

  let domain = "";
  try {
    domain = new URL(tool.websiteUrl).hostname.replace(/^www\./, "");
  } catch {
    domain = tool.websiteUrl;
  }

  const logoSrc = getToolLogoSrc(tool);

  // Verification Display Logic
  let VerificationIcon = ShieldQuestion;
  let verificationColor = "text-slate-500 dark:text-slate-400";
  const verificationText = getVerificationLabel(tool.verificationStatus);

  if (tool.verificationStatus === VerificationStatus.VERIFIED) {
    VerificationIcon = ShieldCheck;
    verificationColor = "text-emerald-700 dark:text-emerald-400";
  } else if (tool.verificationStatus === VerificationStatus.NEEDS_REVIEW) {
    VerificationIcon = ShieldAlert;
    verificationColor = "text-amber-700 dark:text-amber-400";
  }

  let metadataObj: any = {};
  if (tool.metadata) {
    try {
      metadataObj = JSON.parse(tool.metadata);
    } catch (e) {
      // ignore
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-[1000px] mx-auto px-5 md:px-6 py-10 md:py-16">
        
        {/* Breadcrumb */}
        <nav className="flex items-center gap-1.5 text-[13px] text-muted-foreground mb-8" aria-label="Breadcrumb">
          <Link href="/" className="hover:text-foreground transition-colors">Home</Link>
          <ChevronRight className="w-3.5 h-3.5" strokeWidth={1.5} />
          <Link href="/tools" className="hover:text-foreground transition-colors">Tools</Link>
          <ChevronRight className="w-3.5 h-3.5" strokeWidth={1.5} />
          <Link href={`/categories/${tool.category.slug}`} className="hover:text-foreground transition-colors">
            {tool.category.name}
          </Link>
          <ChevronRight className="w-3.5 h-3.5" strokeWidth={1.5} />
          <span className="text-foreground font-medium">{tool.name}</span>
        </nav>

        {/* Minimal Header */}
        <div className="flex flex-col md:flex-row md:items-start gap-6 md:gap-8 mb-16 pb-12 border-b border-border">
          <div className="w-20 h-20 md:w-24 md:h-24 rounded-2xl bg-muted border border-border flex items-center justify-center p-3 shrink-0">
            {logoSrc ? (
              <img src={logoSrc} alt={`${tool.name} Logo`} className="w-12 h-12 md:w-14 md:h-14 object-contain" />
            ) : (
              <div className="text-2xl font-bold text-muted-foreground">{tool.name.charAt(0)}</div>
            )}
          </div>

          <div className="flex-1">
            <h1 className="text-[34px] md:text-[44px] lg:text-[48px] font-bold text-foreground tracking-tight leading-[1.05] mb-3">
              {tool.name}
            </h1>
            <p className="text-[18px] md:text-[21px] text-muted-foreground mb-6 max-w-3xl leading-relaxed">
              {tool.description}
            </p>

            <div className="flex flex-wrap items-center gap-3 mb-8">
              <span className={`text-[13px] font-semibold px-3 py-1 rounded-md border ${pricing.className}`}>
                {pricing.label}
              </span>
              <span className="w-1 h-1 bg-border rounded-full" />
              <Link href={`/categories/${tool.category.slug}`} className="text-[13px] font-medium text-muted-foreground hover:text-foreground transition-colors">
                {tool.category.name}
              </Link>
              <span className="w-1 h-1 bg-border rounded-full" />
              <div className={`flex items-center gap-1.5 text-[13px] font-medium ${verificationColor}`}>
                <VerificationIcon className="w-4 h-4" />
                {verificationText}
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-4">
              <Link
                href={`/go/${tool.slug}`}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-3.5 bg-primary text-primary-foreground text-[15px] font-semibold rounded-xl hover:bg-primary-hover transition-colors"
              >
                Visit {tool.name}
                <ExternalLink className="w-4 h-4" strokeWidth={2} />
              </Link>
              {tool.sourceUrl && (
                <Link
                  href={tool.sourceUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 bg-background border border-border text-foreground text-[14px] font-medium rounded-xl hover:bg-muted transition-colors"
                >
                  <Globe className="w-4 h-4 text-muted-foreground" />
                  View Official Source
                </Link>
              )}
            </div>
          </div>
        </div>

        {/* Content & Metadata */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 mb-16">
          <div className="lg:col-span-2 space-y-12">
            
            <section>
              <h2 className="text-[20px] font-bold text-foreground mb-4 flex items-center gap-2">
                <Layers className="w-5 h-5 text-muted-foreground" />
                Overview
              </h2>
              <div className="prose prose-slate prose-p:leading-relaxed prose-p:text-[15px] prose-p:text-muted-foreground prose-headings:text-foreground dark:prose-invert max-w-none">
                
                <h3 className="flex items-center gap-2 mt-0">
                  <span className="w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-[13px] font-bold shrink-0">1</span>
                  What is {tool.name}?
                </h3>
                <p>
                  <strong>{tool.name}</strong> is a specialized {tool.category.name.toLowerCase()} solution classified as a {tool.entityType}. Operating under a {pricing.label.toLowerCase()} model, it is designed to provide users with a robust environment tailored for modern workflows.
                </p>

                <h3 className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-[13px] font-bold shrink-0">2</span>
                  What does it do?
                </h3>
                <p>
                  At its core, {tool.name} focuses on the following: {tool.description} It bridges the gap between complex requirements and user-friendly execution, ensuring that users have access to the right features.
                </p>

                <h3 className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-[13px] font-bold shrink-0">3</span>
                  How does it help?
                </h3>
                <p>
                  By integrating {tool.name} into your routine, you can significantly reduce manual effort in the {tool.category.name.toLowerCase()} domain. It enhances overall productivity, allowing you to achieve higher-quality results efficiently. Essentially, it acts as a force multiplier for your creative and technical output.
                </p>

                {tool.hostingGuide && (
                  <>
                    <h3 className="flex items-center gap-2">
                      <span className="w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-[13px] font-bold shrink-0">4</span>
                      Hosting & Deployment
                    </h3>
                    <ReactMarkdown>{tool.hostingGuide}</ReactMarkdown>
                  </>
                )}
              </div>
            </section>

            {/* Entity-specific Metadata Render */}
            {Object.keys(metadataObj).length > 0 && (
              <section>
                <h2 className="text-[20px] font-bold text-foreground mb-4 flex items-center gap-2">
                  <Server className="w-5 h-5 text-muted-foreground" />
                  Specifications
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {Object.entries(metadataObj).map(([key, value]) => (
                    <div key={key} className="bg-muted border border-border rounded-xl p-4">
                      <div className="text-[12px] text-muted-foreground font-medium uppercase tracking-wider mb-1">
                        {key.replace(/([A-Z])/g, ' $1').trim()}
                      </div>
                      <div className="text-[14px] font-medium text-foreground">
                        {String(value)}
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}
          </div>

          <aside className="space-y-6">
            <div className="bg-muted rounded-2xl p-6 border border-border">
              <h3 className="text-[14px] font-bold text-foreground mb-4 uppercase tracking-wider">
                Information
              </h3>
              <dl className="space-y-4 text-[14px]">
                <div>
                  <dt className="text-muted-foreground mb-1">Entity Type</dt>
                  <dd className="font-semibold text-foreground">{tool.entityType}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground mb-1">Pricing Model</dt>
                  <dd className="font-semibold text-foreground">{pricing.label}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground mb-1">Category</dt>
                  <dd className="font-semibold text-foreground">{tool.category.name}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground mb-1">Domain</dt>
                  <dd className="font-medium text-foreground">{domain}</dd>
                </div>
                {tool.lastVerifiedAt && (
                  <div className="pt-4 mt-4 border-t border-border">
                    <dt className="flex items-center gap-1.5 text-muted-foreground mb-1">
                      <Clock className="w-3.5 h-3.5" />
                      Last Verified
                    </dt>
                    <dd className="font-medium text-foreground">
                      {new Date(tool.lastVerifiedAt).toLocaleDateString()}
                    </dd>
                  </div>
                )}
              </dl>
            </div>
          </aside>
        </div>

        {/* Alternatives */}
        {alternatives.length > 0 && (
          <div className="pt-16 border-t border-border">
            <div className="flex items-end justify-between mb-8">
              <div>
                <h2 className="text-[24px] font-bold text-foreground tracking-tight">
                  Alternatives to {tool.name}
                </h2>
                <p className="text-[15px] text-muted-foreground mt-1.5">
                  Explore similar {tool.category.name.toLowerCase()} tools and models
                </p>
              </div>
              <Link
                href={`/categories/${tool.category.slug}`}
                className="hidden sm:inline-flex items-center gap-1.5 text-[14px] font-medium text-muted-foreground hover:text-foreground transition-colors"
              >
                View category
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
              {alternatives.map((alt) => (
                <ToolCard key={alt.id} tool={alt} />
              ))}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}

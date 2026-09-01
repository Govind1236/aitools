import { db } from "@/lib/db";
import { notFound } from "next/navigation";
import { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, ExternalLink, AlertTriangle } from "lucide-react";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const tool = await db.tool.findUnique({
    where: { slug },
  });

  if (!tool) {
    return {
      title: "Tool Not Found | AI Tools Directory",
    };
  }

  return {
    title: `Using ${tool.name} | AI Tools Directory`,
    description: tool.description,
  };
}

export default async function PlayPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const tool = await db.tool.findUnique({
    where: { slug, isPublished: true },
    include: { category: true },
  });

  if (!tool) {
    notFound();
  }

  return (
    <div className="flex flex-col h-screen w-full bg-slate-900 text-white overflow-hidden">
      {/* Top Navigation Bar */}
      <div className="flex items-center justify-between px-4 h-14 bg-slate-950 border-b border-slate-800 shrink-0">
        <div className="flex items-center gap-4">
          <Link
            href={`/tools/${tool.slug}`}
            className="flex items-center gap-1.5 text-sm font-medium text-slate-300 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Details
          </Link>
          <div className="h-4 w-[1px] bg-slate-800 hidden sm:block" />
          <div className="hidden sm:flex items-center gap-2">
            <span className="font-semibold">{tool.name}</span>
            <span className="text-xs text-slate-500 px-2 py-0.5 bg-slate-800 rounded-md">
              {tool.category.name}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden md:flex items-center gap-1.5 text-xs text-amber-500/80 mr-2">
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>If the app refuses to connect, use the fallback button &rarr;</span>
          </div>
          <a
            href={`/go/${tool.slug}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 px-3 py-1.5 rounded-lg transition-colors"
          >
            Open in New Tab
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      </div>

      {/* Iframe Viewer */}
      <div className="flex-1 w-full relative bg-white">
        <iframe
          src={tool.websiteUrl}
          className="absolute inset-0 w-full h-full border-none"
          title={tool.name}
          sandbox="allow-same-origin allow-scripts allow-forms allow-popups"
          loading="lazy"
        />
      </div>
    </div>
  );
}

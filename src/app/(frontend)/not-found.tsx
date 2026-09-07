import Link from "next/link";
import { Search, ArrowLeft, Home } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-[65vh] flex items-center justify-center">
      <div className="text-center px-6">
        {/* Large 404 number */}
        <div className="relative inline-block mb-8">
          <span className="text-[120px] md:text-[160px] font-bold text-slate-100 dark:text-accent leading-none tracking-tighter select-none">
            404
          </span>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-16 h-16 rounded-2xl bg-background border border-border shadow-[0_4px_12px_rgba(0,0,0,0.06)] flex items-center justify-center">
              <Search className="w-7 h-7 text-slate-300 dark:text-slate-600" strokeWidth={1.5} />
            </div>
          </div>
        </div>

        <h1 className="text-[32px] md:text-[40px] font-bold text-foreground tracking-tight mb-3">
          Page Not Found
        </h1>
        <p className="text-[16px] text-muted-foreground mb-10 max-w-md mx-auto leading-relaxed">
          The page you&apos;re looking for doesn&apos;t exist or has been moved.
          Let&apos;s get you back on track.
        </p>

        <div className="flex items-center justify-center gap-3">
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground text-[14px] font-medium rounded-full hover:bg-primary-hover transition-all duration-200 shadow-sm"
          >
            <Home className="w-4 h-4" strokeWidth={1.5} />
            Go Home
          </Link>
          <Link
            href="/tools"
            className="inline-flex items-center gap-2 px-6 py-3 border border-border text-foreground text-[14px] font-medium rounded-full hover:bg-accent hover:border-border-hover transition-all duration-200"
          >
            Browse Tools
            <ArrowLeft className="w-4 h-4" strokeWidth={1.5} />
          </Link>
        </div>
      </div>
    </div>
  );
}

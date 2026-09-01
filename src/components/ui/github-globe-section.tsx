import { Globe } from "@/components/ui/globe";
import { Sparkles, Globe as GlobeIcon } from "lucide-react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

export function GithubGlobeSection() {
  return (
    <section className="relative overflow-hidden bg-slate-950 py-20 md:py-32">
      {/* Background gradients */}
      <div className="absolute inset-0 w-full h-full">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-blue-600/20 rounded-full blur-[100px] opacity-50 mix-blend-screen pointer-events-none" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] bg-violet-600/20 rounded-full blur-[80px] opacity-50 mix-blend-screen pointer-events-none" />
      </div>

      <div className="relative max-w-[1200px] mx-auto px-5 md:px-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-8 items-center">
          
          {/* Text Content */}
          <div className="order-2 lg:order-1 flex flex-col justify-center text-center lg:text-left z-10">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-white/10 border border-white/10 rounded-full text-[12px] font-medium text-blue-200 mb-6 mx-auto lg:mx-0 shadow-sm backdrop-blur-md w-max">
              <GlobeIcon className="w-3.5 h-3.5" />
              <span>Global Reach</span>
            </div>
            
            <h2 className="text-[32px] md:text-[40px] lg:text-[48px] font-bold text-white tracking-[-0.02em] leading-[1.1]">
              Explore AI Tools from <br className="hidden lg:block" />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-violet-400">
                Around the World.
              </span>
            </h2>
            
            <p className="text-[15px] md:text-[16.5px] text-slate-400 mt-5 max-w-lg mx-auto lg:mx-0 leading-relaxed">
              Our directory features the best AI engines, local models, and developer tools built by leading researchers and engineers globally. Find the right stack for your next big project.
            </p>
            
            <div className="mt-8 flex flex-col sm:flex-row items-center gap-4 justify-center lg:justify-start">
              <Link
                href="/tools"
                className="inline-flex items-center gap-2 px-6 py-3 bg-white text-slate-900 text-[14px] font-semibold rounded-xl hover:bg-slate-100 transition-all shadow-[0_0_20px_rgba(255,255,255,0.1)] active:scale-[0.98]"
              >
                Browse Directory
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                href="/categories"
                className="inline-flex items-center gap-2 px-6 py-3 bg-slate-800 text-white text-[14px] font-semibold rounded-xl border border-slate-700 hover:bg-slate-700 transition-all active:scale-[0.98]"
              >
                View Categories
              </Link>
            </div>
          </div>

          {/* Globe Container */}
          <div className="order-1 lg:order-2 relative h-[350px] sm:h-[450px] lg:h-[600px] w-full flex items-center justify-center">
            {/* The Globe itself */}
            <div className="absolute inset-0 w-full h-full z-10 flex items-center justify-center translate-y-[10%] lg:translate-y-0 scale-[1.2] lg:scale-[1.1]">
              <Globe />
            </div>
            
            {/* Subtle glow behind globe */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[80%] h-[80%] bg-blue-500/10 rounded-full blur-[60px] -z-10" />
          </div>
        </div>
      </div>
    </section>
  );
}

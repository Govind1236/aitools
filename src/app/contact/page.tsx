import { Metadata } from "next";
import { Mail, Send, MessageSquare, ArrowUpRight } from "lucide-react";

export const metadata: Metadata = {
  title: "Contact Us",
  description:
    "Get in touch with AI Tools Directory. Submit your AI tool or ask a question.",
};

export default function ContactPage() {
  return (
    <div className="max-w-[1200px] mx-auto px-5 md:px-6 py-10 md:py-14">
      <div className="text-center mb-12">
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-muted border border-border rounded-full text-[12px] text-muted-foreground mb-4 dark:bg-muted dark:border-border dark:text-muted-foreground">
          <MessageSquare className="w-3.5 h-3.5" />
          Get in touch
        </div>
        <h1 className="text-[30px] md:text-[38px] font-bold text-foreground tracking-tight mb-2">
          Contact Us
        </h1>
        <p className="text-[16px] text-muted-foreground max-w-md mx-auto leading-relaxed">
          Have a question or want to submit your AI tool? We&apos;d love to hear
          from you.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl mx-auto">
        <a
          href="mailto:submit@aitoolsdirectory.com"
          className="group bg-background rounded-[18px] border border-border p-6 hover:border-border-hover hover:shadow-[0_12px_28px_rgba(0,0,0,0.06)] transition-all duration-300 block dark:hover:border-border-hover"
        >
          <div className="w-11 h-11 rounded-[12px] bg-[#0071e3]/10 flex items-center justify-center text-[#0071e3] mb-4 group-hover:bg-[#0071e3] group-hover:text-white transition-all duration-300 dark:bg-[#2997ff]/10 dark:text-[#2997ff]">
            <Send className="w-4.5 h-4.5" strokeWidth={1.5} />
          </div>
          <h2 className="text-[16px] font-semibold text-foreground mb-1.5">
            Submit Your Tool
          </h2>
          <p className="text-[14px] text-muted-foreground mb-4 leading-relaxed">
            Want to list your AI tool in our directory? Send us the details and
            we&apos;ll review it.
          </p>
          <span className="inline-flex items-center gap-1.5 text-[13.5px] font-medium text-[#0071e3] group-hover:text-[#0077ed] transition-colors duration-150 dark:text-[#2997ff]">
            <Mail className="w-3.5 h-3.5" strokeWidth={1.5} />
            submit@aitoolsdirectory.com
            <ArrowUpRight className="w-3 h-3 transition-transform duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" strokeWidth={1.5} />
          </span>
        </a>

        <a
          href="mailto:hello@aitoolsdirectory.com"
          className="group bg-background rounded-[18px] border border-border p-6 hover:border-border-hover hover:shadow-[0_12px_28px_rgba(0,0,0,0.06)] transition-all duration-300 block dark:hover:border-border-hover"
        >
          <div className="w-11 h-11 rounded-[12px] bg-accent flex items-center justify-center text-foreground mb-4 group-hover:bg-[#0071e3] group-hover:text-white transition-all duration-300 dark:bg-accent dark:text-foreground">
            <Mail className="w-4.5 h-4.5" strokeWidth={1.5} />
          </div>
          <h2 className="text-[16px] font-semibold text-foreground mb-1.5">
            General Inquiries
          </h2>
          <p className="text-[14px] text-muted-foreground mb-4 leading-relaxed">
            For partnership opportunities, bug reports, or general questions.
          </p>
          <span className="inline-flex items-center gap-1.5 text-[13.5px] font-medium text-[#0071e3] group-hover:text-[#0077ed] transition-colors duration-150 dark:text-[#2997ff]">
            <Mail className="w-3.5 h-3.5" strokeWidth={1.5} />
            hello@aitoolsdirectory.com
            <ArrowUpRight className="w-3 h-3 transition-transform duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" strokeWidth={1.5} />
          </span>
        </a>
      </div>
    </div>
  );
}

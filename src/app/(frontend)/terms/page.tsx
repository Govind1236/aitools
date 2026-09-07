import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms of Service",
  description: "Terms of Service for AI Tools Directory",
};

export default function TermsPage() {
  return (
    <div className="max-w-[680px] mx-auto px-5 md:px-6 py-8 md:py-10">
      <h1 className="text-[30px] md:text-[36px] font-bold text-foreground tracking-tight mb-1.5">
        Terms of Service
      </h1>
      <p className="text-[13px] text-muted-foreground mb-8">
        Last updated: {new Date().toLocaleDateString()}
      </p>

      <div className="space-y-7">
        <Section title="1. Acceptance of Terms">
          <p>
            By accessing or using AI Tools Directory, you agree to be bound by
            these Terms of Service. If you do not agree, do not use the site.
          </p>
        </Section>

        <Section title="2. Description of Service">
          <p>
            AI Tools Directory is a platform for discovering AI tools. We
            provide a curated directory of AI-powered tools and services with
            legitimate outbound link tracking for analytics purposes.
          </p>
        </Section>

        <Section title="3. Acceptable Use">
          <p>You agree not to:</p>
          <ul>
            <li>Generate fake traffic or clicks</li>
            <li>Use automated tools to interact with tracked links</li>
            <li>Attempt to manipulate analytics data</li>
            <li>Use the service for any fraudulent purpose</li>
            <li>Interfere with the proper functioning of the site</li>
          </ul>
        </Section>

        <Section title="4. Intellectual Property">
          <p>
            The content on this site, including tool descriptions and
            categories, is provided for informational purposes. Tool names and
            descriptions belong to their respective owners.
          </p>
        </Section>

        <Section title="5. Disclaimer">
          <p>
            Tool listings are provided as-is. We do not guarantee the
            availability, accuracy, or quality of third-party tools. Links to
            external sites do not constitute endorsement.
          </p>
        </Section>

        <Section title="6. Limitation of Liability">
          <p>
            AI Tools Directory shall not be liable for any indirect, incidental,
            or consequential damages arising from your use of the service.
          </p>
        </Section>

        <Section title="7. Changes to Terms">
          <p>
            We may update these terms at any time. Continued use of the site
            constitutes acceptance of updated terms.
          </p>
        </Section>
      </div>
    </div>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section>
      <h2 className="text-[16px] font-semibold text-foreground mb-2.5">
        {title}
      </h2>
      <div className="text-[14px] text-muted-foreground leading-relaxed space-y-2 [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:space-y-1 [&_li]:marker:text-[#d2d2d7] dark:[&_li]:marker:text-muted-foreground">
        {children}
      </div>
    </section>
  );
}

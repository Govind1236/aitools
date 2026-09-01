import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "Privacy Policy for AI Tools Directory",
};

export default function PrivacyPage() {
  return (
    <div className="max-w-[680px] mx-auto px-5 md:px-6 py-8 md:py-10">
      <h1 className="text-[30px] md:text-[36px] font-bold text-foreground tracking-tight mb-1.5">
        Privacy Policy
      </h1>
      <p className="text-[13px] text-muted-foreground mb-8">
        Last updated: {new Date().toLocaleDateString()}
      </p>

      <div className="space-y-7">
        <Section title="1. Information We Collect">
          <p>
            We collect minimal information necessary to provide our services:
          </p>
          <ul>
            <li>
              <strong>Analytics Data:</strong> Referrer URLs, UTM parameters,
              device type, browser, operating system, and approximate country
              location derived from IP addresses.
            </li>
            <li>
              <strong>Account Information:</strong> Admin account email and
              hashed passwords for authentication.
            </li>
          </ul>
        </Section>

        <Section title="2. How We Use Information">
          <ul>
            <li>To measure outbound click activity for legitimate analytics</li>
            <li>To improve our directory and user experience</li>
            <li>To detect and prevent abuse</li>
            <li>To provide administrative access</li>
          </ul>
        </Section>

        <Section title="3. What We Do NOT Collect">
          <ul>
            <li>We do not store raw IP addresses permanently</li>
            <li>We do not collect personal browsing history</li>
            <li>We do not use tracking cookies for advertising</li>
            <li>We do not sell or share personal data with third parties</li>
          </ul>
        </Section>

        <Section title="4. Data Retention">
          <p>
            Analytics data is retained for operational purposes. Click event
            data may be periodically aggregated and anonymized. IP addresses
            used for rate limiting are not stored permanently.
          </p>
        </Section>

        <Section title="5. Third-Party Services">
          <p>
            We may use third-party advertising services in the future. Any such
            integration will be subject to its own privacy policy. Currently, we
            do not use third-party advertising or tracking services.
          </p>
        </Section>

        <Section title="6. Contact">
          <p>
            If you have questions about this privacy policy, please contact us
            at{" "}
            <a
              href="mailto:privacy@aitoolsdirectory.com"
              className="text-[#0071e3] hover:text-[#0077ed] underline underline-offset-2 transition-colors duration-150 dark:text-[#2997ff]"
            >
              privacy@aitoolsdirectory.com
            </a>
            .
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

import { NextRequest, NextResponse } from "next/server";
import { recordClick } from "@/lib/analytics";
import { getRedirectLink } from "@/lib/payload/redirects";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;

  // Find the redirect link in Payload
  const link = await getRedirectLink(slug);

  // If link not found or disabled, redirect to /tools
  if (!link || !link.isActive) {
    return NextResponse.redirect(new URL("/tools", request.url), {
      status: 302,
    });
  }

  // Extract UTM parameters
  const url = new URL(request.url);
  const utmSource = url.searchParams.get("utm_source");
  const utmMedium = url.searchParams.get("utm_medium");
  const utmCampaign = url.searchParams.get("utm_campaign");
  const utmContent = url.searchParams.get("utm_content");
  const utmTerm = url.searchParams.get("utm_term");

  // Get client info
  const userAgent = request.headers.get("user-agent") || undefined;
  const referrer = request.headers.get("referer") || undefined;

  // Check geo routes
  let destination = link.destination;

  const countryHeader = request.headers.get("cf-ipcountry") ||
                         request.headers.get("x-country-code") || undefined;

  if (countryHeader && link.geoRoutes.length > 0) {
    const geoRoute = link.geoRoutes.find(
      (r) => r.country.toUpperCase() === countryHeader.toUpperCase()
    );
    if (geoRoute) {
      destination = geoRoute.destination;
    }
  }

  // Record click asynchronously (non-blocking)
  try {
    await recordClick({
      linkId: link.id,
      referrer,
      utmSource: utmSource || undefined,
      utmMedium: utmMedium || undefined,
      utmCampaign: utmCampaign || undefined,
      utmContent: utmContent || undefined,
      utmTerm: utmTerm || undefined,
      country: countryHeader || undefined,
      userAgent,
      ipAddress: undefined, // Enforcing anonymous tracking
    });
  } catch (error) {
    // Don't let tracking errors break the redirect
    console.error("Failed to record click:", error);
  }

  // Validate destination is a real URL (prevent open redirect abuse)
  try {
    const destUrl = new URL(destination);
    if (!["http:", "https:"].includes(destUrl.protocol)) {
      return NextResponse.redirect(new URL("/tools", request.url), {
        status: 302,
      });
    }
  } catch {
    return NextResponse.redirect(new URL("/tools", request.url), {
      status: 302,
    });
  }

  // 302 redirect to destination
  return NextResponse.redirect(destination, { status: 302 });
}
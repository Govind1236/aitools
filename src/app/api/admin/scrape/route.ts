import { NextRequest, NextResponse } from "next/server";
import * as cheerio from "cheerio";
import { getCurrentUser } from "@/lib/auth";
import { validateUrl } from "@/lib/validation";

export async function POST(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: { url?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const { url } = body;
  const urlValidation = validateUrl(url || "");
  if (!urlValidation.valid) {
    return NextResponse.json(
      { error: urlValidation.error },
      { status: 400 }
    );
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15000);

  try {
    const response = await fetch(url as string, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (compatible; AI-Tools-Directory/1.0; +https://aitools.directory)",
      },
      signal: controller.signal,
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: `Failed to fetch the URL (status ${response.status})` },
        { status: 502 }
      );
    }

    const html = await response.text();
    const $ = cheerio.load(html);

    const title = $("meta[property='og:title']").attr("content")?.trim() || $("title").first().text().trim();
    const description =
      $("meta[property='og:description']").attr("content")?.trim() ||
      $('meta[name="description"]').attr("content")?.trim();

    const base = new URL(url as string);
    const resolveUrl = (value: string | undefined) => {
      if (!value) return undefined;
      try {
        return new URL(value, base.origin).toString();
      } catch {
        return undefined;
      }
    };

    const logo =
      resolveUrl(
        $('link[rel="icon"]').attr("href") ||
          $('link[rel="shortcut icon"]').attr("href") ||
          $('link[rel="apple-touch-icon"]').attr("href") ||
          $("meta[property='og:image']").attr("content")
      ) || resolveUrl("/favicon.ico");

    return NextResponse.json({ name: title, description, logo });
  } catch (error: unknown) {
    const message =
      error instanceof Error && error.name === "AbortError"
        ? "The request timed out"
        : "Failed to fetch the URL";
    return NextResponse.json({ error: message }, { status: 502 });
  } finally {
    clearTimeout(timeout);
  }
}
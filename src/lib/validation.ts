// Input validation utilities

const SLUG_REGEX = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validateSlug(slug: string): { valid: boolean; error?: string } {
  if (!slug || slug.length < 2) {
    return { valid: false, error: "Slug must be at least 2 characters" };
  }
  if (slug.length > 100) {
    return { valid: false, error: "Slug must be less than 100 characters" };
  }
  if (!SLUG_REGEX.test(slug)) {
    return {
      valid: false,
      error: "Slug must contain only lowercase letters, numbers, and hyphens",
    };
  }
  return { valid: true };
}

export function validateEmail(email: string): { valid: boolean; error?: string } {
  if (!email || !EMAIL_REGEX.test(email)) {
    return { valid: false, error: "Invalid email address" };
  }
  return { valid: true };
}

export function validateUrl(url: string): { valid: boolean; error?: string } {
  if (!url) {
    return { valid: false, error: "URL is required" };
  }
  try {
    const parsed = new URL(url);
    if (!["http:", "https:"].includes(parsed.protocol)) {
      return { valid: false, error: "URL must use HTTP or HTTPS" };
    }
    return { valid: true };
  } catch {
    return { valid: false, error: "Invalid URL format" };
  }
}

export function validatePassword(password: string): { valid: boolean; error?: string } {
  if (!password || password.length < 8) {
    return { valid: false, error: "Password must be at least 8 characters" };
  }
  return { valid: true };
}

export function sanitizeString(str: string): string {
  return str
    .replace(/[<>]/g, "") // Basic XSS prevention
    .trim();
}

export function createSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

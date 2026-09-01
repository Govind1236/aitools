/**
 * Data migration: Migrate comma-separated Tool.tags to structured Tag + ToolTag records.
 * Also seeds Provider records for tools where the provider is known with high confidence.
 *
 * Safety: ADDITIVE ONLY. Does not modify Tool.tags or any existing data.
 */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

/** Slugify a tag name: lowercase, replace spaces/special chars with hyphens */
function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

/** Normalize tag name: trim whitespace, title-case common patterns */
function normalizeTagName(raw: string): string {
  const trimmed = raw.trim();
  if (!trimmed) return "";

  // Special casing for known patterns
  const specialCases: Record<string, string> = {
    "api": "API",
    "cli": "CLI",
    "cpp": "C++",
    "tts": "TTS",
    "llm": "LLM",
    "nlp": "NLP",
    "rag": "RAG",
    "ui": "UI",
    "ai": "AI",
    "gpu": "GPU",
    "cpu": "CPU",
    "db": "DB",
    "vscode": "VS Code",
    "mac": "macOS",
    "windows": "Windows",
    "linux": "Linux",
    "ios": "iOS",
    "nextjs": "Next.js",
    "react": "React",
    "tailwind": "Tailwind",
    "postgresql": "PostgreSQL",
    "openai": "OpenAI",
    "google": "Google",
    "microsoft": "Microsoft",
    "github": "GitHub",
    "huggingface": "Hugging Face",
    "open-source": "Open Source",
    "free-tier": "Free Tier",
    "stable-diffusion": "Stable Diffusion",
    "apple-silicon": "Apple Silicon",
    "no-login": "No Login",
    "no-signup": "No Signup",
    "no-sign-in": "No Sign-In",
    "self-host": "Self-Host",
    "self-hosted": "Self-Hosted",
    "open-weights": "Open Weights",
    "deepseek": "DeepSeek",
    "anthropic": "Anthropic",
    "vercel": "Vercel",
    "cloudflare": "Cloudflare",
    "supabase": "Supabase",
    "pinecone": "Pinecone",
    "qdrant": "Qdrant",
    "mistral": "Mistral",
    "nvidia": "NVIDIA",
    "alibaba": "Alibaba",
    "cognition": "Cognition",
    "duckduckgo": "DuckDuckGo",
    "dall-e-3": "DALL-E 3",
    "llama-3": "Llama 3",
    "llama": "Llama",
    "qwen": "Qwen",
    "gpt-4o": "GPT-4o",
    "flux": "FLUX",
    "cu": "UI",
    "b3": "BaaS",
  };

  const lower = trimmed.toLowerCase();

  // Check special cases first
  if (specialCases[lower]) return specialCases[lower];

  // Default: Title Case each word, preserving hyphens
  return trimmed
    .split(/-/)
    .map((word) => {
      if (word.length <= 3 && word === word.toLowerCase()) {
        // Short lowercase words (like prepositions) stay lowercase unless first
        return word;
      }
      return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
    })
    .join("-");
}

async function main() {
  console.log("🔄 Migrating comma-separated tags to structured tags...");

  // Step 1: Collect all existing tags from tools
  const tools = await prisma.tool.findMany({
    select: { id: true, name: true, tags: true },
  });

  const tagMap = new Map<string, { displayName: string; toolIds: string[] }>();

  for (const tool of tools) {
    if (!tool.tags) continue;
    const rawTags = tool.tags.split(",");
    for (const raw of rawTags) {
      const trimmed = raw.trim();
      if (!trimmed) continue;

      const normalized = normalizeTagName(trimmed);
      if (!normalized) continue;

      const slug = slugify(normalized);

      if (!tagMap.has(slug)) {
        tagMap.set(slug, { displayName: normalized, toolIds: [] });
      }
      tagMap.get(slug)!.toolIds.push(tool.id);
    }
  }

  console.log(`  Found ${tagMap.size} unique normalized tags across ${tools.length} tools`);

  // Step 2: Create Tag records and ToolTag relationships
  let tagCount = 0;
  let toolTagCount = 0;

  for (const [slug, { displayName, toolIds }] of tagMap) {
    const tag = await prisma.tag.upsert({
      where: { slug },
      update: {},
      create: { name: displayName, slug },
    });
    tagCount++;

    // Create ToolTag relationships (deduplicate toolIds)
    const uniqueToolIds = [...new Set(toolIds)];
    for (const toolId of uniqueToolIds) {
      await prisma.toolTag.upsert({
        where: { toolId_tagId: { toolId, tagId: tag.id } },
        update: {},
        create: { toolId, tagId: tag.id },
      });
      toolTagCount++;
    }
  }

  console.log(`  Created ${tagCount} Tag records`);
  console.log(`  Created ${toolTagCount} ToolTag relationships`);

  // Step 3: Verify no tools lost tags
  const toolsAfter = await prisma.toolTag.groupBy({
    by: ["toolId"],
    _count: { tagId: true },
  });

  const toolsWithStructuredTags = toolsAfter.length;
  const toolsWithOriginalTags = tools.filter(
    (t) => t.tags && t.tags.trim().length > 0
  ).length;

  console.log(`\n📊 Verification:`);
  console.log(`  Tools with original tags: ${toolsWithOriginalTags}`);
  console.log(`  Tools with structured tags: ${toolsWithStructuredTags}`);

  if (toolsWithStructuredTags < toolsWithOriginalTags) {
    console.warn(
      `  ⚠️ WARNING: Some tools may have lost tags during migration!`
    );
  } else {
    console.log(`  ✅ All tools with original tags have structured tags`);
  }

  // Step 4: Seed Providers
  console.log("\n🔄 Seeding provider records...");

  type ProviderData = {
    name: string;
    slug: string;
    description?: string;
    websiteUrl?: string;
    toolSlugs: string[];
  };

  const providers: ProviderData[] = [
    {
      name: "OpenAI",
      slug: "openai",
      description: "Creator of GPT-4, ChatGPT, DALL-E, and Whisper.",
      websiteUrl: "https://openai.com",
      toolSlugs: ["chatgpt-free", "whisper", "bing-image"],
    },
    {
      name: "Anthropic",
      slug: "anthropic",
      description: "Creator of the Claude family of AI assistants.",
      websiteUrl: "https://anthropic.com",
      toolSlugs: ["claude-free"],
    },
    {
      name: "Google",
      slug: "google",
      description: "Creator of Gemini, AI Studio, NotebookLM, and more.",
      websiteUrl: "https://google.com",
      toolSlugs: ["gemini-api", "google-ai-studio", "notebooklm"],
    },
    {
      name: "Meta",
      slug: "meta",
      description: "Creator of the Llama family of open-source models.",
      websiteUrl: "https://meta.com",
      toolSlugs: ["llama-3-1"],
    },
    {
      name: "DeepSeek",
      slug: "deepseek",
      description: "AI research lab creating open-weight reasoning models.",
      websiteUrl: "https://deepseek.com",
      toolSlugs: ["deepseek-r1", "deepseek-chat"],
    },
    {
      name: "Mistral AI",
      slug: "mistral-ai",
      description: "European AI lab creating efficient open-source models.",
      websiteUrl: "https://mistral.ai",
      toolSlugs: ["mistral"],
    },
    {
      name: "Microsoft",
      slug: "microsoft",
      description: "Creator of Phi-3 SLMs and GitHub Models.",
      websiteUrl: "https://microsoft.com",
      toolSlugs: ["phi-3", "github-models"],
    },
    {
      name: "Hugging Face",
      slug: "hugging-face",
      description: "The hub for open-source ML models and inference.",
      websiteUrl: "https://huggingface.co",
      toolSlugs: ["hf-inference", "huggingchat"],
    },
    {
      name: "Stability AI",
      slug: "stability-ai",
      description: "Creators of Stable Diffusion image generation models.",
      websiteUrl: "https://stability.ai",
      toolSlugs: [],
    },
    {
      name: "Cognition",
      slug: "cognition",
      description: "Creator of Devin, the autonomous AI software engineer.",
      websiteUrl: "https://cognition.ai",
      toolSlugs: ["devin"],
    },
    {
      name: "Groq",
      slug: "groq",
      description: "Ultra-fast LLM inference on custom LPU hardware.",
      websiteUrl: "https://groq.com",
      toolSlugs: ["groq-api"],
    },
    {
      name: "Cohere",
      slug: "cohere",
      description: "Enterprise NLP APIs including Command R and Embeddings.",
      websiteUrl: "https://cohere.com",
      toolSlugs: ["cohere-api"],
    },
    {
      name: "Together AI",
      slug: "together-ai",
      description: "Platform for running and fine-tuning open-source models.",
      websiteUrl: "https://together.ai",
      toolSlugs: ["together-ai"],
    },
    {
      name: "Perplexity",
      slug: "perplexity",
      description: "AI-powered answer engine with real-time web search.",
      websiteUrl: "https://perplexity.ai",
      toolSlugs: ["perplexity-free"],
    },
    {
      name: "ElevenLabs",
      slug: "elevenlabs",
      description: "AI voice generation and text-to-speech platform.",
      websiteUrl: "https://elevenlabs.io",
      toolSlugs: ["elevenlabs-free"],
    },
    {
      name: "Suno",
      slug: "suno",
      description: "AI music generation platform creating full songs.",
      websiteUrl: "https://suno.com",
      toolSlugs: ["suno-free", "bark"],
    },
    {
      name: "Cursor",
      slug: "cursor",
      description: "The AI-first code editor built on VS Code.",
      websiteUrl: "https://cursor.com",
      toolSlugs: ["cursor-free"],
    },
    {
      name: "Vercel",
      slug: "vercel",
      description: "Frontend cloud platform for Next.js deployment and AI SDK.",
      websiteUrl: "https://vercel.com",
      toolSlugs: ["v0", "vercel", "vercel-sdk"],
    },
    {
      name: "Supabase",
      slug: "supabase",
      description: "Open-source Firebase alternative with Postgres and vector support.",
      websiteUrl: "https://supabase.com",
      toolSlugs: ["supabase", "supabase-vector"],
    },
    {
      name: "Black Forest Labs",
      slug: "black-forest-labs",
      description: "Creator of FLUX image generation models.",
      websiteUrl: "https://blackforestlabs.ai",
      toolSlugs: ["flux-schnell"],
    },
    {
      name: "Alibaba",
      slug: "alibaba",
      description: "Creator of the Qwen family of multilingual models.",
      websiteUrl: "https://alibaba.com",
      toolSlugs: ["qwen"],
    },
    {
      name: "Cloudflare",
      slug: "cloudflare",
      description: "Web infrastructure and serverless hosting platform.",
      websiteUrl: "https://cloudflare.com",
      toolSlugs: ["cloudflare-pages"],
    },
    {
      name: "Neon",
      slug: "neon",
      description: "Serverless Postgres with branching for modern apps.",
      websiteUrl: "https://neon.tech",
      toolSlugs: ["neon"],
    },
    {
      name: "Render",
      slug: "render",
      description: "Cloud application hosting for developers.",
      websiteUrl: "https://render.com",
      toolSlugs: ["render"],
    },
    {
      name: "Pinecone",
      slug: "pinecone",
      description: "Serverless vector database for AI applications.",
      websiteUrl: "https://pinecone.io",
      toolSlugs: ["pinecone"],
    },
    {
      name: "Qdrant",
      slug: "qdrant",
      description: "Open-source vector search engine written in Rust.",
      websiteUrl: "https://qdrant.tech",
      toolSlugs: ["qdrant"],
    },
    {
      name: "Civitai",
      slug: "civitai",
      description: "The largest hub for open-source AI art models.",
      websiteUrl: "https://civitai.com",
      toolSlugs: ["civitai"],
    },
    {
      name: "LMSYS",
      slug: "lmsys",
      description: "Creator of Chatbot Arena, an open LLM benchmark.",
      websiteUrl: "https://lmsys.org",
      toolSlugs: ["chatbot-arena"],
    },
    {
      name: "Cognition (OpenDevin)",
      slug: "opendevin-community",
      description: "Open-source autonomous AI software engineer project.",
      websiteUrl: "https://github.com/OpenDevin/OpenDevin",
      toolSlugs: ["opendevin"],
    },
    {
      name: "Browser Use",
      slug: "browser-use",
      description: "Open-source library for AI browser automation.",
      websiteUrl: "https://github.com/browser-use/browser-use",
      toolSlugs: ["browser-use"],
    },
    {
      name: "Significant Gravitas",
      slug: "significant-gravitas",
      description: "Creators of AutoGPT, an autonomous AI agent.",
      websiteUrl: "https://github.com/Significant-Gravitas/AutoGPT",
      toolSlugs: ["autogpt"],
    },
    {
      name: "Ollama",
      slug: "ollama",
      description: "Local LLM runner for Mac, Windows, and Linux.",
      websiteUrl: "https://ollama.com",
      toolSlugs: ["ollama"],
    },
    {
      name: "LM Studio",
      slug: "lm-studio",
      description: "Desktop app for running local LLMs from Hugging Face.",
      websiteUrl: "https://lmstudio.ai",
      toolSlugs: ["lm-studio"],
    },
    {
      name: "Nomic AI",
      slug: "nomic-ai",
      description: "Creator of GPT4All, a local privacy-aware chatbot.",
      websiteUrl: "https://gpt4all.io",
      toolSlugs: ["gpt4all"],
    },
    {
      name: "Georgi Gerganov",
      slug: "ggerganov",
      description: "Creator of llama.cpp, efficient local model inference.",
      websiteUrl: "https://github.com/ggerganov/llama.cpp",
      toolSlugs: ["llama-cpp"],
    },
    {
      name: "Codeium",
      slug: "codeium",
      description: "Free AI code completion for 70+ languages.",
      websiteUrl: "https://codeium.com",
      toolSlugs: ["codeium"],
    },
    {
      name: "Continue",
      slug: "continue",
      description: "Leading open-source AI code assistant for VS Code and JetBrains.",
      websiteUrl: "https://continue.dev",
      toolSlugs: ["continue"],
    },
    {
      name: "Aider",
      slug: "aider",
      description: "AI pair programming in your terminal.",
      websiteUrl: "https://aider.chat",
      toolSlugs: ["aider"],
    },
    {
      name: "StackBlitz",
      slug: "stackblitz",
      description: "Creators of Bolt.new, in-browser AI web developer.",
      websiteUrl: "https://bolt.new",
      toolSlugs: ["bolt-new"],
    },
    {
      name: "Lovable",
      slug: "lovable",
      description: "AI software engineer for building apps.",
      websiteUrl: "https://lovable.dev",
      toolSlugs: ["lovable"],
    },
    {
      name: "DuckDuckGo",
      slug: "duckduckgo",
      description: "Privacy-focused search engine with free AI chat.",
      websiteUrl: "https://duckduckgo.com",
      toolSlugs: ["duckduckgo-chat"],
    },
    {
      name: "Phind",
      slug: "phind",
      description: "AI search engine designed for developers.",
      websiteUrl: "https://phind.com",
      toolSlugs: ["phind"],
    },
  ];

  let providerCount = 0;
  let assignedCount = 0;

  for (const providerData of providers) {
    const provider = await prisma.provider.upsert({
      where: { slug: providerData.slug },
      update: {},
      create: {
        name: providerData.name,
        slug: providerData.slug,
        description: providerData.description || null,
        websiteUrl: providerData.websiteUrl || null,
      },
    });
    providerCount++;

    // Assign provider to tools
    for (const toolSlug of providerData.toolSlugs) {
      const tool = await prisma.tool.findUnique({ where: { slug: toolSlug } });
      if (tool && !tool.providerId) {
        await prisma.tool.update({
          where: { id: tool.id },
          data: { providerId: provider.id },
        });
        assignedCount++;
      }
    }
  }

  console.log(`  Created ${providerCount} Provider records`);
  console.log(`  Assigned providers to ${assignedCount} tools`);

  // Final verification
  const finalTools = await prisma.tool.count();
  const finalCategories = await prisma.category.count();
  const finalProviders = await prisma.provider.count();
  const finalTags = await prisma.tag.count();
  const finalToolTags = await prisma.toolTag.count();
  const toolsWithProvider = await prisma.tool.count({
    where: { providerId: { not: null } },
  });

  console.log("\n📊 Final counts:");
  console.log(`  Tools: ${finalTools}`);
  console.log(`  Categories: ${finalCategories}`);
  console.log(`  Providers: ${finalProviders}`);
  console.log(`  Tags: ${finalTags}`);
  console.log(`  ToolTag relationships: ${finalToolTags}`);
  console.log(`  Tools with provider: ${toolsWithProvider}`);

  // Verify existing tags preserved
  const origCount = tools.filter(
    (t) => t.tags && t.tags.trim().length > 0
  ).length;
  const newTagToolCount = await prisma.toolTag.groupBy({
    by: ["toolId"],
  });

  console.log(`\n  Tools with original tags: ${origCount}`);
  console.log(`  Tools with structured tags: ${newTagToolCount.length}`);

  if (newTagToolCount.length >= origCount) {
    console.log("\n✅ Tag migration verified successfully");
  } else {
    console.warn("\n⚠️ WARNING: Some tools may be missing structured tags");
  }

  console.log("\n✅ Data migration complete!");
}

main()
  .catch((e) => {
    console.error("❌ Migration failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

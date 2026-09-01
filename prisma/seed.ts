import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

// Map a tool slug to its entity type (TOOL default).
const MODEL_SLUGS = ["deepseek-r1", "llama-3-1", "qwen", "mistral", "phi-3"];
const AGENT_SLUGS = ["opendevin", "browser-use", "autogpt", "devin"];
const API_SLUGS = [
  "groq-api",
  "gemini-api",
  "github-models",
  "hf-inference",
  "cohere-api",
  "together-ai",
  "vercel-sdk",
  "chatbot-arena",
  "google-ai-studio",
  "v0",
  "bolt-new",
  "lovable",
];
const INFRA_SLUGS = [
  "pinecone",
  "supabase-vector",
  "qdrant",
  "vercel",
  "render",
  "cloudflare-pages",
  "supabase",
  "neon",
];

function entityTypeFor(slug: string, categoryId: string): string {
  if (MODEL_SLUGS.includes(slug)) return "MODEL";
  if (AGENT_SLUGS.includes(slug)) return "AGENT";
  if (API_SLUGS.includes(slug)) return "API";
  if (INFRA_SLUGS.includes(slug)) return "INFRASTRUCTURE";
  return "TOOL";
}

// Map tool slug -> provider slug (high-confidence assignments only).
const PROVIDER_MAP: Record<string, string> = {
  "chatgpt-free": "openai",
  "whisper": "openai",
  "bing-image": "openai",
  "claude-free": "anthropic",
  "gemini-api": "google",
  "google-ai-studio": "google",
  "notebooklm": "google",
  "llama-3-1": "meta",
  "deepseek-r1": "deepseek",
  "deepseek-chat": "deepseek",
  "mistral": "mistral-ai",
  "phi-3": "microsoft",
  "github-models": "microsoft",
  "hf-inference": "hugging-face",
  "huggingchat": "hugging-face",
  "devin": "cognition",
  "groq-api": "groq",
  "cohere-api": "cohere",
  "together-ai": "together-ai",
  "perplexity-free": "perplexity",
  "elevenlabs-free": "elevenlabs",
  "suno-free": "suno",
  "bark": "suno",
  "cursor-free": "cursor",
  "v0": "vercel",
  "vercel": "vercel",
  "vercel-sdk": "vercel",
  "supabase": "supabase",
  "supabase-vector": "supabase",
  "flux-schnell": "black-forest-labs",
  "qwen": "alibaba",
  "cloudflare-pages": "cloudflare",
  "neon": "neon",
  "render": "render",
  "pinecone": "pinecone",
  "qdrant": "qdrant",
  "civitai": "civitai",
  "chatbot-arena": "lmsys",
  "opendevin": "opendevin-community",
  "browser-use": "browser-use",
  "autogpt": "significant-gravitas",
  "ollama": "ollama",
  "lm-studio": "lm-studio",
  "gpt4all": "nomic-ai",
  "llama-cpp": "ggerganov",
  "codeium": "codeium",
  "continue": "continue",
  "aider": "aider",
  "bolt-new": "stackblitz",
  "lovable": "lovable",
  "duckduckgo-chat": "duckduckgo",
  "phind": "phind",
};

const PROVIDERS_DATA = [
  { name: "OpenAI", slug: "openai", description: "Creator of GPT-4, ChatGPT, DALL-E, and Whisper.", websiteUrl: "https://openai.com" },
  { name: "Anthropic", slug: "anthropic", description: "Creator of the Claude family of AI assistants.", websiteUrl: "https://anthropic.com" },
  { name: "Google", slug: "google", description: "Creator of Gemini, AI Studio, NotebookLM, and more.", websiteUrl: "https://google.com" },
  { name: "Meta", slug: "meta", description: "Creator of the Llama family of open-source models.", websiteUrl: "https://meta.com" },
  { name: "DeepSeek", slug: "deepseek", description: "AI research lab creating open-weight reasoning models.", websiteUrl: "https://deepseek.com" },
  { name: "Mistral AI", slug: "mistral-ai", description: "European AI lab creating efficient open-source models.", websiteUrl: "https://mistral.ai" },
  { name: "Microsoft", slug: "microsoft", description: "Creator of Phi-3 SLMs and GitHub Models.", websiteUrl: "https://microsoft.com" },
  { name: "Hugging Face", slug: "hugging-face", description: "The hub for open-source ML models and inference.", websiteUrl: "https://huggingface.co" },
  { name: "Stability AI", slug: "stability-ai", description: "Creators of Stable Diffusion image generation models.", websiteUrl: "https://stability.ai" },
  { name: "Cognition", slug: "cognition", description: "Creator of Devin, the autonomous AI software engineer.", websiteUrl: "https://cognition.ai" },
  { name: "Groq", slug: "groq", description: "Ultra-fast LLM inference on custom LPU hardware.", websiteUrl: "https://groq.com" },
  { name: "Cohere", slug: "cohere", description: "Enterprise NLP APIs including Command R and Embeddings.", websiteUrl: "https://cohere.com" },
  { name: "Together AI", slug: "together-ai", description: "Platform for running and fine-tuning open-source models.", websiteUrl: "https://together.ai" },
  { name: "Perplexity", slug: "perplexity", description: "AI-powered answer engine with real-time web search.", websiteUrl: "https://perplexity.ai" },
  { name: "ElevenLabs", slug: "elevenlabs", description: "AI voice generation and text-to-speech platform.", websiteUrl: "https://elevenlabs.io" },
  { name: "Suno", slug: "suno", description: "AI music generation platform creating full songs.", websiteUrl: "https://suno.com" },
  { name: "Cursor", slug: "cursor", description: "The AI-first code editor built on VS Code.", websiteUrl: "https://cursor.com" },
  { name: "Vercel", slug: "vercel", description: "Frontend cloud platform for Next.js deployment and AI SDK.", websiteUrl: "https://vercel.com" },
  { name: "Supabase", slug: "supabase", description: "Open-source Firebase alternative with Postgres and vector support.", websiteUrl: "https://supabase.com" },
  { name: "Black Forest Labs", slug: "black-forest-labs", description: "Creator of FLUX image generation models.", websiteUrl: "https://blackforestlabs.ai" },
  { name: "Alibaba", slug: "alibaba", description: "Creator of the Qwen family of multilingual models.", websiteUrl: "https://alibaba.com" },
  { name: "Cloudflare", slug: "cloudflare", description: "Web infrastructure and serverless hosting platform.", websiteUrl: "https://cloudflare.com" },
  { name: "Neon", slug: "neon", description: "Serverless Postgres with branching for modern apps.", websiteUrl: "https://neon.tech" },
  { name: "Render", slug: "render", description: "Cloud application hosting for developers.", websiteUrl: "https://render.com" },
  { name: "Pinecone", slug: "pinecone", description: "Serverless vector database for AI applications.", websiteUrl: "https://pinecone.io" },
  { name: "Qdrant", slug: "qdrant", description: "Open-source vector search engine written in Rust.", websiteUrl: "https://qdrant.tech" },
  { name: "Civitai", slug: "civitai", description: "The largest hub for open-source AI art models.", websiteUrl: "https://civitai.com" },
  { name: "LMSYS", slug: "lmsys", description: "Creator of Chatbot Arena, an open LLM benchmark.", websiteUrl: "https://lmsys.org" },
  { name: "OpenDevin", slug: "opendevin-community", description: "Open-source autonomous AI software engineer project.", websiteUrl: "https://github.com/OpenDevin/OpenDevin" },
  { name: "Browser Use", slug: "browser-use", description: "Open-source library for AI browser automation.", websiteUrl: "https://github.com/browser-use/browser-use" },
  { name: "Significant Gravitas", slug: "significant-gravitas", description: "Creators of AutoGPT, an autonomous AI agent.", websiteUrl: "https://github.com/Significant-Gravitas/AutoGPT" },
  { name: "Ollama", slug: "ollama", description: "Local LLM runner for Mac, Windows, and Linux.", websiteUrl: "https://ollama.com" },
  { name: "LM Studio", slug: "lm-studio", description: "Desktop app for running local LLMs from Hugging Face.", websiteUrl: "https://lmstudio.ai" },
  { name: "Nomic AI", slug: "nomic-ai", description: "Creator of GPT4All, a local privacy-aware chatbot.", websiteUrl: "https://gpt4all.io" },
  { name: "Georgi Gerganov", slug: "ggerganov", description: "Creator of llama.cpp, efficient local model inference.", websiteUrl: "https://github.com/ggerganov/llama.cpp" },
  { name: "Codeium", slug: "codeium", description: "Free AI code completion for 70+ languages.", websiteUrl: "https://codeium.com" },
  { name: "Continue", slug: "continue", description: "Leading open-source AI code assistant for VS Code and JetBrains.", websiteUrl: "https://continue.dev" },
  { name: "Aider", slug: "aider", description: "AI pair programming in your terminal.", websiteUrl: "https://aider.chat" },
  { name: "StackBlitz", slug: "stackblitz", description: "Creators of Bolt.new, in-browser AI web developer.", websiteUrl: "https://bolt.new" },
  { name: "Lovable", slug: "lovable", description: "AI software engineer for building apps.", websiteUrl: "https://lovable.dev" },
  { name: "DuckDuckGo", slug: "duckduckgo", description: "Privacy-focused search engine with free AI chat.", websiteUrl: "https://duckduckgo.com" },
  { name: "Phind", slug: "phind", description: "AI search engine designed for developers.", websiteUrl: "https://phind.com" },
];

async function main() {
  console.log("🌱 Seeding database with Free AI Tools & APIs...");

  // Clean existing data
  await prisma.clickEvent.deleteMany();
  await prisma.geoRoute.deleteMany();
  await prisma.redirectLink.deleteMany();
  await prisma.campaign.deleteMany();
  await prisma.toolTag.deleteMany();
  await prisma.tag.deleteMany();
  await prisma.tool.deleteMany();
  await prisma.category.deleteMany();
  await prisma.provider.deleteMany();
  await prisma.session.deleteMany();
  await prisma.user.deleteMany();

  // ============================================================
  // ADMIN USER
  // ============================================================
  const passwordHash = await bcrypt.hash("admin123", 12);
  const admin = await prisma.user.create({
    data: {
      email: "admin@aitoolsdirectory.com",
      name: "Admin",
      passwordHash,
      role: "admin",
    },
  });
  console.log(`✅ Admin user created: ${admin.email} / admin123`);

  // ============================================================
  // CATEGORIES (Genuine functional categories)
  // ============================================================
  const categories = await Promise.all([
    prisma.category.create({
      data: { name: "Writing", slug: "writing", description: "AI writers, editors, paraphrasing, and document assistance.", sortOrder: 1 },
    }),
    prisma.category.create({
      data: { name: "Coding", slug: "coding", description: "AI code assistants, autocomplete, and pair-programming tools.", sortOrder: 2 },
    }),
    prisma.category.create({
      data: { name: "Image", slug: "image", description: "AI tools for generating, editing, and enhancing images.", sortOrder: 3 },
    }),
    prisma.category.create({
      data: { name: "Video", slug: "video", description: "AI text-to-video, editing, and avatar generation.", sortOrder: 4 },
    }),
    prisma.category.create({
      data: { name: "Audio", slug: "audio", description: "AI text-to-speech, voice, transcription, and music.", sortOrder: 5 },
    }),
    prisma.category.create({
      data: { name: "Research", slug: "research", description: "AI answer engines, deep research, and source-grounded tools.", sortOrder: 6 },
    }),
    prisma.category.create({
      data: { name: "Productivity", slug: "productivity", description: "General-purpose AI assistants for work, notes, and workflows.", sortOrder: 7 },
    }),
    prisma.category.create({
      data: { name: "Marketing", slug: "marketing", description: "AI tools for content, SEO, ads, and campaign automation.", sortOrder: 8 },
    }),
    prisma.category.create({
      data: { name: "Design", slug: "design", description: "AI tools for visual design, UI, and brand assets.", sortOrder: 9 },
    }),
    prisma.category.create({
      data: { name: "Education", slug: "education", description: "AI tools for learning, tutoring, and study assistance.", sortOrder: 10 },
    }),
    prisma.category.create({
      data: { name: "Automation", slug: "automation", description: "AI workflow automation and agentic task tooling.", sortOrder: 11 },
    }),
    prisma.category.create({
      data: { name: "Business", slug: "business", description: "AI tools for operations, sales, and business management.", sortOrder: 12 },
    }),
    prisma.category.create({
      data: { name: "Developer", slug: "developer", description: "AI developer APIs, infrastructure, hosting, and databases.", sortOrder: 13 },
    }),
    prisma.category.create({
      data: { name: "Agents", slug: "agents", description: "Autonomous AI agents that browse, code, and act on your behalf.", sortOrder: 14 },
    }),
    prisma.category.create({
      data: { name: "Models", slug: "models", description: "Open-weight and hosted AI models for self-hosting or API use.", sortOrder: 15 },
    }),
  ]);

  const catMap = new Map(categories.map((c) => [c.slug, c.id]));
  console.log(`✅ ${categories.length} categories created`);

  // ============================================================
  // PROVIDERS
  // ============================================================
  const providers = await Promise.all(
    PROVIDERS_DATA.map((p) =>
      prisma.provider.create({
        data: {
          name: p.name,
          slug: p.slug,
          description: p.description,
          websiteUrl: p.websiteUrl,
        },
      })
    )
  );
  const providerMap = new Map(providers.map((p) => [p.slug, p.id]));
  console.log(`✅ ${providers.length} providers created`);

  // ============================================================
  // TOOLS (100% Free or Generous Free Tiers)
  // ============================================================
  const toolsData = [
    // ── AI Engines ──
    {
      name: "Groq API",
      slug: "groq-api",
      description: "Lightning-fast inference API running open-source models (Llama 3, Mixtral) on LPUs. Offers a generous free tier for developers.",
      websiteUrl: "https://console.groq.com",
      pricingType: "free",
      categoryId: catMap.get("developer")!,
      rating: 4.9,
      isFeatured: true,
      tags: "api,inference,fast,llama-3,mixtral,free-tier",
    },
    {
      name: "Google Gemini API",
      slug: "gemini-api",
      description: "Google's developer API for Gemini 1.5 Flash and Pro. Offers a massive free tier (15 RPM, 1M tokens/min) for developers.",
      websiteUrl: "https://aistudio.google.com",
      pricingType: "free",
      categoryId: catMap.get("developer")!,
      rating: 4.9,
      isFeatured: true,
      tags: "api,google,multimodal,flash,generous-free-tier",
    },
    {
      name: "GitHub Models",
      slug: "github-models",
      description: "Free access to frontier models (GPT-4o, Claude 3.5 Sonnet, Llama 3.1) directly via GitHub for testing and prototyping.",
      websiteUrl: "https://github.com/marketplace/models",
      pricingType: "free",
      categoryId: catMap.get("developer")!,
      rating: 4.8,
      isFeatured: true,
      tags: "api,github,playground,prototyping,multiple-models",
    },
    {
      name: "Together AI",
      slug: "together-ai",
      description: "Platform to run, train, and fine-tune open-source models. Offers a generous $5 free credit to test inference APIs.",
      websiteUrl: "https://www.together.ai",
      pricingType: "freemium",
      categoryId: catMap.get("developer")!,
      rating: 4.7,
      isFeatured: false,
      tags: "api,open-source,inference,fine-tuning",
    },
    {
      name: "Hugging Face Inference API",
      slug: "hf-inference",
      description: "Serverless inference API for thousands of open-source models hosted on Hugging Face. Free to use for experimentation.",
      websiteUrl: "https://huggingface.co/inference-api",
      pricingType: "free",
      categoryId: catMap.get("developer")!,
      rating: 4.8,
      isFeatured: true,
      tags: "api,huggingface,serverless,open-source",
    },
    {
      name: "Cohere API",
      slug: "cohere-api",
      description: "Enterprise-grade NLP APIs (Command R, Embeddings). Offers a free developer tier for non-commercial research and prototyping.",
      websiteUrl: "https://cohere.com",
      pricingType: "freemium",
      categoryId: catMap.get("developer")!,
      rating: 4.6,
      isFeatured: false,
      tags: "api,nlp,embeddings,command-r,developer-tier",
    },

    // ── AI Agents ──
    {
      name: "OpenDevin",
      slug: "opendevin",
      description: "An open-source AI software engineer that can write code, run terminal commands, and browse the web autonomously.",
      websiteUrl: "https://github.com/OpenDevin/OpenDevin",
      pricingType: "free",
      categoryId: catMap.get("agents")!,
      rating: 4.8,
      isFeatured: true,
      tags: "agent,developer,coding,open-source,autonomous",
    },
    {
      name: "Browser Use",
      slug: "browser-use",
      description: "An open-source library that allows AI agents to securely interact with and control web browsers like a human.",
      websiteUrl: "https://github.com/browser-use/browser-use",
      pricingType: "free",
      categoryId: catMap.get("agents")!,
      rating: 4.9,
      isFeatured: true,
      tags: "agent,browser,automation,open-source",
    },
    {
      name: "AutoGPT",
      slug: "autogpt",
      description: "An experimental open-source attempt to make GPT-4 fully autonomous. It strings together LLM thoughts to achieve goals.",
      websiteUrl: "https://github.com/Significant-Gravitas/AutoGPT",
      pricingType: "free",
      categoryId: catMap.get("agents")!,
      rating: 4.6,
      isFeatured: false,
      tags: "agent,autonomous,goals,open-source",
    },
    {
      name: "Devin (Early Access)",
      slug: "devin",
      description: "The world's first fully autonomous AI software engineer by Cognition. Handles entire engineering tasks end-to-end.",
      websiteUrl: "https://cognition.ai",
      pricingType: "freemium",
      categoryId: catMap.get("agents")!,
      rating: 4.9,
      isFeatured: true,
      tags: "agent,developer,cognition,autonomous",
    },

    // ── Open Source Models ──
    {
      name: "DeepSeek R1",
      slug: "deepseek-r1",
      description: "State-of-the-art open-weights reasoning model that rivals proprietary models in math, logic, and coding tasks.",
      websiteUrl: "https://huggingface.co/deepseek-ai",
      pricingType: "free",
      categoryId: catMap.get("models")!,
      rating: 4.9,
      isFeatured: true,
      tags: "open-source,reasoning,deepseek,math,coding",
    },
    {
      name: "Meta Llama 3.1",
      slug: "llama-3-1",
      description: "Meta's most capable open-source models (8B, 70B, 405B) offering incredible performance for general text generation and coding.",
      websiteUrl: "https://llama.meta.com",
      pricingType: "free",
      categoryId: catMap.get("models")!,
      rating: 4.9,
      isFeatured: true,
      tags: "open-source,meta,llama,versatile,405b",
    },
    {
      name: "Qwen 2.5",
      slug: "qwen",
      description: "Alibaba's powerful open-source multilingual and coding models, performing exceptionally well on reasoning benchmarks.",
      websiteUrl: "https://qwenlm.github.io",
      pricingType: "free",
      categoryId: catMap.get("models")!,
      rating: 4.8,
      isFeatured: true,
      tags: "open-source,alibaba,qwen,multilingual,coding",
    },
    {
      name: "Mistral NeMo",
      slug: "mistral",
      description: "A 12B parameter open-source model built jointly by Mistral and NVIDIA, highly efficient and performant for its size.",
      websiteUrl: "https://mistral.ai",
      pricingType: "free",
      categoryId: catMap.get("models")!,
      rating: 4.7,
      isFeatured: false,
      tags: "open-source,mistral,nvidia,efficient,12b",
    },
    {
      name: "Phi-3",
      slug: "phi-3",
      description: "Microsoft's family of Small Language Models (SLMs) that punch way above their weight class, perfect for running locally on phones and laptops.",
      websiteUrl: "https://azure.microsoft.com/en-us/blog/introducing-phi-3-redefining-whats-possible-with-slms/",
      pricingType: "free",
      categoryId: catMap.get("models")!,
      rating: 4.7,
      isFeatured: false,
      tags: "open-source,microsoft,slm,local,efficient",
    },

    // ── Local AI Runners ──
    {
      name: "Ollama",
      slug: "ollama",
      description: "Get up and running with large language models locally. Run Llama 3, Phi 3, Mistral, and more locally via CLI or API.",
      websiteUrl: "https://ollama.com",
      pricingType: "free",
      categoryId: catMap.get("developer")!,
      rating: 4.9,
      isFeatured: true,
      tags: "local,cli,runner,mac,windows,linux",
      hostingGuide: `### How to Host & Run Ollama for Free

Ollama allows you to run massive open-source models completely free on your own hardware. There are no API keys, no subscriptions, and it works completely offline.

#### Step 1: Install Ollama
Download the installer for your OS (macOS, Windows, or Linux) from the [official website](https://ollama.com/download). 

Alternatively, for Linux or WSL, run:
\`\`\`bash
curl -fsSL https://ollama.com/install.sh | sh
\`\`\`

#### Step 2: Run a Model
Once installed, open your terminal and run a model. If you don't have it downloaded, Ollama will automatically pull it.

**For Llama 3.1 (8B):**
\`\`\`bash
ollama run llama3.1
\`\`\`

**For DeepSeek R1:**
\`\`\`bash
ollama run deepseek-r1
\`\`\`

#### Step 3: Connect via API (Localhost)
Ollama runs a local server automatically. You can connect to it just like the OpenAI API, completely for free:

\`\`\`javascript
const response = await fetch('http://localhost:11434/api/generate', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    model: 'llama3.1',
    prompt: 'Why is the sky blue?'
  })
});
\`\`\`
`,
    },
    {
      name: "LM Studio",
      slug: "lm-studio",
      description: "Discover, download, and run local LLMs from Hugging Face on your own machine via a beautiful desktop GUI. Provides a local server.",
      websiteUrl: "https://lmstudio.ai",
      pricingType: "free",
      categoryId: catMap.get("developer")!,
      rating: 4.8,
      isFeatured: true,
      tags: "local,gui,huggingface,desktop-app,server",
    },
    {
      name: "GPT4All",
      slug: "gpt4all",
      description: "A free-to-use, locally running, privacy-aware chatbot. No GPU or internet required. Run open-source LLMs on any consumer CPU.",
      websiteUrl: "https://gpt4all.io",
      pricingType: "free",
      categoryId: catMap.get("developer")!,
      rating: 4.6,
      isFeatured: false,
      tags: "local,cpu,privacy,offline,chatbot",
    },
    {
      name: "Llama.cpp",
      slug: "llama-cpp",
      description: "Port of Facebook's LLaMA model in C/C++. Run massive models efficiently on Apple Silicon and standard CPUs.",
      websiteUrl: "https://github.com/ggerganov/llama.cpp",
      pricingType: "free",
      categoryId: catMap.get("developer")!,
      rating: 4.8,
      isFeatured: false,
      tags: "local,cpp,efficient,apple-silicon,cpu",
    },

    // ── Free AI Chatbots ──
    {
      name: "DeepSeek Chat",
      slug: "deepseek-chat",
      description: "Free web interface to access DeepSeek V3 and the DeepSeek R1 reasoning model. Extremely capable and completely free.",
      websiteUrl: "https://chat.deepseek.com",
      pricingType: "free",
      categoryId: catMap.get("productivity")!,
      rating: 4.9,
      isFeatured: true,
      tags: "chatbot,deepseek,reasoning,free",
    },
    {
      name: "ChatGPT (Free Tier)",
      slug: "chatgpt-free",
      description: "OpenAI offers GPT-4o Mini and limited GPT-4o usage completely for free. Includes data analysis, vision, and web search.",
      websiteUrl: "https://chat.openai.com",
      pricingType: "freemium",
      categoryId: catMap.get("productivity")!,
      rating: 4.8,
      isFeatured: true,
      tags: "chatbot,openai,gpt-4o,free-tier",
    },
    {
      name: "Claude (Free Tier)",
      slug: "claude-free",
      description: "Anthropic provides free access to Claude 3.5 Sonnet, arguably the best coding and writing model currently available.",
      websiteUrl: "https://claude.ai",
      pricingType: "freemium",
      categoryId: catMap.get("productivity")!,
      rating: 4.9,
      isFeatured: true,
      tags: "chatbot,anthropic,sonnet,coding,writing",
    },
    {
      name: "HuggingChat",
      slug: "huggingchat",
      description: "The open-source alternative to ChatGPT. Completely free access to top open models like Llama 3.1, Qwen, and Cohere Command R+.",
      websiteUrl: "https://huggingface.co/chat",
      pricingType: "free",
      categoryId: catMap.get("productivity")!,
      rating: 4.7,
      isFeatured: true,
      tags: "chatbot,open-source,huggingface,free,multiple-models",
    },
    {
      name: "DuckDuckGo AI Chat",
      slug: "duckduckgo-chat",
      description: "Free, private, anonymous access to GPT-4o mini, Claude 3 Haiku, Llama 3, and Mixtral directly in your browser. No login required.",
      websiteUrl: "https://duckduckgo.com/chat",
      pricingType: "free",
      categoryId: catMap.get("productivity")!,
      rating: 4.6,
      isFeatured: false,
      tags: "chatbot,privacy,anonymous,no-login,free",
    },

    // ── AI Playgrounds ──
    {
      name: "Vercel AI SDK Playground",
      slug: "vercel-sdk",
      description: "Test multiple LLMs side-by-side using the Vercel AI SDK. Free to experiment with various open-source and proprietary models.",
      websiteUrl: "https://sdk.vercel.ai",
      pricingType: "free",
      categoryId: catMap.get("developer")!,
      rating: 4.7,
      isFeatured: true,
      tags: "playground,vercel,side-by-side,testing",
    },
    {
      name: "Chatbot Arena",
      slug: "chatbot-arena",
      description: "LMSYS Chatbot Arena: A crowdsourced benchmark platform where you can chat with two anonymous models (including GPT-4, Claude 3.5, Gemini) for free.",
      websiteUrl: "https://chat.lmsys.org",
      pricingType: "free",
      categoryId: catMap.get("developer")!,
      rating: 4.8,
      isFeatured: true,
      tags: "playground,benchmark,crowdsourced,free,arena",
    },
    {
      name: "Google AI Studio",
      slug: "google-ai-studio",
      description: "Google's web-based prototyping environment for developers to experiment with Gemini models. Completely free to use.",
      websiteUrl: "https://aistudio.google.com",
      pricingType: "free",
      categoryId: catMap.get("developer")!,
      rating: 4.8,
      isFeatured: false,
      tags: "playground,google,gemini,prototyping,developer",
    },

    // ── Free Coding Assistants ──
    {
      name: "Codeium",
      slug: "codeium",
      description: "Completely free AI code completion tool for over 70+ languages. Available as an extension for VS Code, JetBrains, Visual Studio, and more.",
      websiteUrl: "https://codeium.com",
      pricingType: "free",
      categoryId: catMap.get("coding")!,
      rating: 4.8,
      isFeatured: true,
      tags: "coding,autocomplete,extension,free,multi-language",
    },
    {
      name: "Cursor (Free Tier)",
      slug: "cursor-free",
      description: "The AI-first code editor. The free tier offers 14 days of Pro features, followed by generous basic completion and local model support.",
      websiteUrl: "https://cursor.com",
      pricingType: "freemium",
      categoryId: catMap.get("coding")!,
      rating: 4.7,
      isFeatured: true,
      tags: "editor,vscode-fork,ai-native,freemium",
    },
    {
      name: "Continue.dev",
      slug: "continue",
      description: "The leading open-source AI code assistant. Connect any model (local via Ollama, or API via Groq/Anthropic) to VS Code or JetBrains.",
      websiteUrl: "https://continue.dev",
      pricingType: "free",
      categoryId: catMap.get("coding")!,
      rating: 4.8,
      isFeatured: true,
      tags: "open-source,extension,bring-your-own-model,local-support",
    },
    {
      name: "Aider",
      slug: "aider",
      description: "AI pair programming in your terminal. Works with Claude, GPT-4, and open-source models to edit files in your local git repository.",
      websiteUrl: "https://aider.chat",
      pricingType: "free",
      categoryId: catMap.get("coding")!,
      rating: 4.7,
      isFeatured: false,
      tags: "terminal,cli,pair-programming,open-source,git",
    },

    // ── Free Image Generation ──
    {
      name: "FLUX.1 (schnell)",
      slug: "flux-schnell",
      description: "Black Forest Labs' open-weight fast image generation model. Extremely high quality, free to download, and runnable locally or via API.",
      websiteUrl: "https://huggingface.co/black-forest-labs/FLUX.1-schnell",
      pricingType: "free",
      categoryId: catMap.get("image")!,
      rating: 4.9,
      isFeatured: true,
      tags: "image,open-source,flux,fast,high-res",
    },
    {
      name: "Civitai",
      slug: "civitai",
      description: "The largest hub for open-source AI art models, LoRAs, and checkpoints. Free platform to share, discover, and generate images.",
      websiteUrl: "https://civitai.com",
      pricingType: "free",
      categoryId: catMap.get("image")!,
      rating: 4.8,
      isFeatured: true,
      tags: "models,loras,stable-diffusion,community,free",
    },
    {
      name: "Stable Diffusion WebUI (Automatic1111)",
      slug: "automatic1111",
      description: "The most popular free, open-source browser interface for Stable Diffusion. Run locally to generate and manipulate images for free.",
      websiteUrl: "https://github.com/AUTOMATIC1111/stable-diffusion-webui",
      pricingType: "free",
      categoryId: catMap.get("image")!,
      rating: 4.7,
      isFeatured: true,
      tags: "local,gui,stable-diffusion,open-source,free",
    },
    {
      name: "ComfyUI",
      slug: "comfyui",
      description: "A powerful and modular node-based GUI for Stable Diffusion and FLUX. Completely free and open-source for advanced local image generation workflows.",
      websiteUrl: "https://github.com/comfyanonymous/ComfyUI",
      pricingType: "free",
      categoryId: catMap.get("image")!,
      rating: 4.8,
      isFeatured: false,
      tags: "local,node-based,workflows,stable-diffusion,flux",
    },
    {
      name: "Bing Image Creator",
      slug: "bing-image",
      description: "Free access to OpenAI's DALL-E 3 image generation model via Microsoft Copilot. Generates 4 images per prompt for free.",
      websiteUrl: "https://bing.com/create",
      pricingType: "free",
      categoryId: catMap.get("image")!,
      rating: 4.5,
      isFeatured: false,
      tags: "dall-e-3,microsoft,free,web",
    },

    // ── Free Audio & Voice ──
    {
      name: "ElevenLabs (Free Tier)",
      slug: "elevenlabs-free",
      description: "The best AI voice generator offers a free tier (10,000 characters/month) for hobbyists to generate hyper-realistic TTS.",
      websiteUrl: "https://elevenlabs.io",
      pricingType: "freemium",
      categoryId: catMap.get("audio")!,
      rating: 4.8,
      isFeatured: true,
      tags: "tts,voice,realistic,free-tier",
    },
    {
      name: "Suno AI (Free Tier)",
      slug: "suno-free",
      description: "Generate full songs with vocals and instrumentation. Offers 50 free credits daily (10 songs per day) completely for free.",
      websiteUrl: "https://suno.com",
      pricingType: "freemium",
      categoryId: catMap.get("audio")!,
      rating: 4.8,
      isFeatured: true,
      tags: "music,songs,generation,daily-credits",
    },
    {
      name: "Bark",
      slug: "bark",
      description: "Open-source text-to-audio model created by Suno. Can generate highly realistic, multilingual speech as well as music, background noise, and simple sound effects.",
      websiteUrl: "https://github.com/suno-ai/bark",
      pricingType: "free",
      categoryId: catMap.get("audio")!,
      rating: 4.5,
      isFeatured: false,
      tags: "open-source,audio,tts,sound-effects,local",
    },
    {
      name: "Whisper (OpenAI)",
      slug: "whisper",
      description: "OpenAI's robust, open-source speech recognition system. Transcribe audio to text locally for free with incredible accuracy across languages.",
      websiteUrl: "https://github.com/openai/whisper",
      pricingType: "free",
      categoryId: catMap.get("audio")!,
      rating: 4.9,
      isFeatured: true,
      tags: "transcription,open-source,speech-to-text,local",
    },

    // ── Free AI Search ──
    {
      name: "Perplexity AI (Free Tier)",
      slug: "perplexity-free",
      description: "The revolutionary AI answer engine. The free tier provides unlimited quick searches and a limited number of Pro searches daily.",
      websiteUrl: "https://perplexity.ai",
      pricingType: "freemium",
      categoryId: catMap.get("research")!,
      rating: 4.9,
      isFeatured: true,
      tags: "search,answer-engine,citations,freemium",
    },
    {
      name: "Google NotebookLM",
      slug: "notebooklm",
      description: "Google's free personalized AI researcher. Upload up to 50 documents and it acts as an expert on your sources, generating deep dive audio podcasts.",
      websiteUrl: "https://notebooklm.google.com",
      pricingType: "free",
      categoryId: catMap.get("research")!,
      rating: 4.9,
      isFeatured: true,
      tags: "research,documents,audio-overview,google,free",
    },
    {
      name: "Phind",
      slug: "phind",
      description: "AI search engine specifically designed for developers. Free to use for answering coding questions with direct codebase context and web search.",
      websiteUrl: "https://phind.com",
      pricingType: "free",
      categoryId: catMap.get("research")!,
      rating: 4.6,
      isFeatured: false,
      tags: "search,developers,coding,free",
    },

    // ── Vector Databases (Free Tier) ──
    {
      name: "Pinecone",
      slug: "pinecone",
      description: "Serverless vector database for building RAG applications. The free tier provides 1 serverless index with up to 2GB capacity forever.",
      websiteUrl: "https://pinecone.io",
      pricingType: "freemium",
      categoryId: catMap.get("developer")!,
      rating: 4.7,
      isFeatured: true,
      tags: "vector-db,rag,serverless,free-tier",
    },
    {
      name: "Supabase Vector",
      slug: "supabase-vector",
      description: "Open-source Firebase alternative based on PostgreSQL and pgvector. Generous free tier includes a vector-ready database.",
      websiteUrl: "https://supabase.com/vector",
      pricingType: "freemium",
      categoryId: catMap.get("developer")!,
      rating: 4.8,
      isFeatured: true,
      tags: "vector-db,postgresql,pgvector,open-source,free-tier",
    },
    {
      name: "Qdrant",
      slug: "qdrant",
      description: "Open-source vector search engine. The managed cloud offers a generous free tier (1 Cluster, 1GB RAM, 0.5 CPU) perfect for prototyping.",
      websiteUrl: "https://qdrant.tech",
      pricingType: "freemium",
      categoryId: catMap.get("developer")!,
      rating: 4.7,
      isFeatured: false,
      tags: "vector-db,search-engine,rust,free-tier",
    },

    // ── Free Web Builders ──
    {
      name: "v0 by Vercel (Free Tier)",
      slug: "v0",
      description: "Vercel's generative UI assistant. The free tier gives you a monthly allowance of compute credits to generate React/Tailwind interfaces.",
      websiteUrl: "https://v0.dev",
      pricingType: "freemium",
      categoryId: catMap.get("developer")!,
      rating: 4.8,
      isFeatured: true,
      tags: "ui-generation,react,tailwind,freemium",
    },
    {
      name: "Bolt.new (Free Tier)",
      slug: "bolt-new",
      description: "In-browser AI web developer. Free usage limits available daily to prompt, edit, and deploy full-stack web applications.",
      websiteUrl: "https://bolt.new",
      pricingType: "freemium",
      categoryId: catMap.get("developer")!,
      rating: 4.7,
      isFeatured: true,
      tags: "fullstack,webcontainers,browser,freemium",
    },
    {
      name: "Lovable.dev (Free Tier)",
      slug: "lovable",
      description: "AI software engineer for building apps. Start building for free with daily conversational turns and export code directly.",
      websiteUrl: "https://lovable.dev",
      pricingType: "freemium",
      categoryId: catMap.get("developer")!,
      rating: 4.6,
      isFeatured: false,
      tags: "app-builder,fullstack,export-code,freemium",
    },

    // ── Free Cloud & Hosting ──
    {
      name: "Vercel (Hobby Tier)",
      slug: "vercel",
      description: "The platform for frontend developers. Deploy Next.js, React, and Svelte apps globally for free on the Hobby tier.",
      websiteUrl: "https://vercel.com",
      pricingType: "freemium",
      categoryId: catMap.get("developer")!,
      rating: 4.9,
      isFeatured: true,
      tags: "hosting,nextjs,frontend,serverless",
      hostingGuide: `### How to Deploy Your Web App for Free on Vercel

Vercel offers an incredibly generous **Hobby Tier** that is completely free for personal, non-commercial projects.

#### Step 1: Push to GitHub
Ensure your frontend project (Next.js, React, Vue, etc.) is pushed to a GitHub repository.

#### Step 2: Import Project
1. Log in to [Vercel](https://vercel.com) using your GitHub account.
2. Click **Add New...** and select **Project**.
3. Import your repository from the list.

#### Step 3: Configure and Deploy
Vercel automatically detects the framework (like Next.js) and configures the build settings.
1. Add any Environment Variables required by your app.
2. Click **Deploy**.

Within seconds, your app will be live on a \`.vercel.app\` domain, with a free SSL certificate and global CDN distribution!
`,
    },
    {
      name: "Render (Free Tier)",
      slug: "render",
      description: "Cloud application hosting for developers. The free tier supports deploying static sites, web services, and PostgreSQL databases.",
      websiteUrl: "https://render.com",
      pricingType: "freemium",
      categoryId: catMap.get("developer")!,
      rating: 4.7,
      isFeatured: false,
      tags: "hosting,backend,postgresql,docker",
    },
    {
      name: "Cloudflare Pages",
      slug: "cloudflare-pages",
      description: "Deploy static and JAMstack sites. The free tier offers unlimited bandwidth, making it the best option for high-traffic free sites.",
      websiteUrl: "https://pages.cloudflare.com",
      pricingType: "free",
      categoryId: catMap.get("developer")!,
      rating: 4.9,
      isFeatured: true,
      tags: "hosting,static,unlimited-bandwidth,cdn",
    },

    // ── Backend as a Service ──
    {
      name: "Supabase (Free Tier)",
      slug: "supabase",
      description: "The open-source Firebase alternative. Generous free tier includes a Postgres database, Auth, Storage, and Edge Functions.",
      websiteUrl: "https://supabase.com",
      pricingType: "freemium",
      categoryId: catMap.get("developer")!,
      rating: 4.9,
      isFeatured: true,
      tags: "baas,postgres,auth,storage,open-source",
      hostingGuide: `### How to Use or Self-Host Supabase for Free

Supabase offers two ways to use it entirely for free: the managed Cloud Free Tier, or 100% free Self-Hosting via Docker.

#### Option A: Managed Free Tier
1. Go to [Supabase](https://supabase.com) and create an account.
2. Create a new project. You immediately get a 500MB PostgreSQL database, 1GB of File Storage, and 50,000 monthly active users for Auth.
3. This is perfect for MVP and hobby projects. Note that projects on the free tier pause after 1 week of inactivity.

#### Option B: Self-Hosting (100% Free, No Limits)
Since Supabase is open-source, you can run the entire stack on your own server (or a cheap VPS) using Docker.

\`\`\`bash
# 1. Clone the Supabase repository
git clone --depth 1 https://github.com/supabase/supabase

# 2. Navigate to the docker folder
cd supabase/docker

# 3. Copy the example env file
cp .env.example .env

# 4. Start the stack in detached mode
docker compose up -d
\`\`\`

You now have a production-ready Supabase instance running locally or on your server, accessible via \`http://localhost:8000\`!
`,
    },
    {
      name: "Neon Serverless Postgres",
      slug: "neon",
      description: "Serverless Postgres built for the cloud. The free tier gives you a 500MB database that branches like git.",
      websiteUrl: "https://neon.tech",
      pricingType: "freemium",
      categoryId: catMap.get("developer")!,
      rating: 4.8,
      isFeatured: false,
      tags: "database,postgres,serverless,free-tier",
    },
  ];

  const tools = await Promise.all(
    toolsData.map((data) =>
      prisma.tool.create({
        data: {
          ...data,
          entityType: entityTypeFor(data.slug, data.categoryId ?? ""),
          providerId: providerMap.get(PROVIDER_MAP[data.slug]) ?? null,
        },
      })
    )
  );
  console.log(`✅ ${tools.length} updated tools created`);

  // ============================================================
  // STRUCTURED TAGS (from comma-separated Tool.tags)
  // ============================================================
  const tagMap = new Map<string, { name: string; slug: string }>();

  const toSlug = (name: string) =>
    name
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "");

  for (const tool of tools) {
    if (!tool.tags) continue;
    for (const raw of tool.tags.split(",")) {
      const name = raw.trim();
      if (!name) continue;
      const slug = toSlug(name);
      if (!tagMap.has(slug)) tagMap.set(slug, { name, slug });
    }
  }

  let toolTagCount = 0;
  for (const [slug, { name }] of tagMap) {
    const tag = await prisma.tag.create({ data: { name, slug } });
    for (const tool of tools) {
      if (!tool.tags) continue;
      if (tool.tags.split(",").map((t) => t.trim()).includes(name)) {
        await prisma.toolTag.create({ data: { toolId: tool.id, tagId: tag.id } });
        toolTagCount++;
      }
    }
  }
  console.log(`✅ ${tagMap.size} structured tags created (${toolTagCount} relationships)`);

  // ============================================================
  // CAMPAIGNS
  // ============================================================
  const campaigns = await Promise.all([
    prisma.campaign.create({ data: { name: "Free Tier Directory", description: "Organic discovery for free tools" } }),
    prisma.campaign.create({ data: { name: "Developer API Traffic", description: "Traffic to API docs" } }),
    prisma.campaign.create({ data: { name: "Open Source Community", description: "Traffic to GitHub repos" } }),
  ]);

  // ============================================================
  // REDIRECT LINKS
  // ============================================================
  const linksData = tools.map((tool, index) => ({
    slug: tool.slug,
    name: tool.name,
    destination: tool.websiteUrl,
    toolId: tool.id,
    campaignId: campaigns[index % campaigns.length].id,
    isActive: true,
  }));

  const links = await Promise.all(
    linksData.map((data) => prisma.redirectLink.create({ data }))
  );
  console.log(`✅ ${links.length} redirect links created`);

  // ============================================================
  // SAMPLE CLICK EVENTS FOR ANALYTICS
  // ============================================================
  const sources = ["google", "github", "reddit", "ycombinator", "twitter", "direct", "dev.to", "producthunt"];
  const devices = ["desktop", "mobile", "tablet"];
  const countries = ["US", "GB", "IN", "DE", "CA", "JP", "FR", "SG", "BR"];
  const browsers = ["Chrome", "Firefox", "Safari", "Edge", "Arc"];
  const operatingSystems = ["Windows", "macOS", "Linux", "iOS", "Android"];
  const now = new Date();

  const clickEvents = [];
  for (let i = 0; i < 300; i++) {
    const daysAgo = Math.floor(Math.random() * 30);
    const hoursAgo = Math.floor(Math.random() * 24);
    const timestamp = new Date(now.getTime() - (daysAgo * 24 + hoursAgo) * 60 * 60 * 1000);
    const linkIndex = Math.floor(Math.random() * links.length);
    const source = sources[Math.floor(Math.random() * sources.length)];

    clickEvents.push({
      linkId: links[linkIndex].id,
      timestamp,
      referrer: source !== "direct" ? `https://${source}.com` : null,
      utmSource: source !== "direct" ? source : null,
      utmMedium: source !== "direct" ? (["twitter", "reddit", "ycombinator"].includes(source) ? "social" : "organic") : null,
      utmCampaign: Math.random() > 0.5 ? "free-tier" : null,
      country: countries[Math.floor(Math.random() * countries.length)],
      deviceType: devices[Math.floor(Math.random() * devices.length)],
      browser: browsers[Math.floor(Math.random() * browsers.length)],
      operatingSystem: operatingSystems[Math.floor(Math.random() * operatingSystems.length)],
      trafficType: Math.random() > 0.95 ? "bot" : "human",
      isSuspicious: Math.random() > 0.95,
    });
  }

  await prisma.clickEvent.createMany({ data: clickEvents });
  console.log(`✅ ${clickEvents.length} click events created`);

  console.log("\n🎉 Database seeded successfully with Free AI Tools & APIs!");
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

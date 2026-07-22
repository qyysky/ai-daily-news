import Parser from "rss-parser";
import { writeFileSync, mkdirSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUTPUT = join(__dirname, "..", "data", "news.json");

const parser = new Parser({
  timeout: 15000,
  headers: { "User-Agent": "AI-Daily-News/1.0" },
});

const RSS_FEEDS = [
  { name: "The Verge AI", url: "https://www.theverge.com/rss/ai-artificial-intelligence/index.xml" },
  { name: "VentureBeat AI", url: "https://venturebeat.com/category/ai/feed/" },
  { name: "MIT Tech Review", url: "https://www.technologyreview.com/topic/artificial-intelligence/feed" },
  { name: "Google AI Blog", url: "https://blog.google/technology/ai/rss/" },
  { name: "OpenAI", url: "https://openai.com/news/rss.xml" },
  { name: "Hugging Face", url: "https://huggingface.co/blog/feed.xml" },
  { name: "MarkTechPost", url: "https://www.marktechpost.com/feed/" },
  { name: "量子位", url: "https://www.qbitai.com/feed" },
  { name: "arXiv AI", url: "https://rss.arxiv.org/rss/cs.AI", limit: 10 },
];

const AI_KEYWORDS = [
  "ai", "artificial intelligence", "machine learning", "deep learning",
  "llm", "gpt", "chatgpt", "claude", "gemini", "openai", "anthropic",
  "neural", "transformer", "diffusion", "generative", "大模型", "人工智能",
  "机器学习", "深度学习", "智能",
];

function isAiRelated(text) {
  const lower = (text || "").toLowerCase();
  return AI_KEYWORDS.some((kw) => lower.includes(kw));
}

function stripHtml(html) {
  return (html || "")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 280);
}

function normalizeItem({ title, url, source, publishedAt, summary }) {
  if (!title || !url) return null;
  return {
    id: Buffer.from(url).toString("base64url").slice(0, 32),
    title: title.trim(),
    url,
    source,
    publishedAt: publishedAt || new Date().toISOString(),
    summary: summary || "",
  };
}

async function fetchRssFeed({ name, url, limit = 15 }) {
  try {
    const feed = await parser.parseURL(url);
    return (feed.items || [])
      .slice(0, limit)
      .map((item) =>
        normalizeItem({
          title: item.title,
          url: item.link || item.guid,
          source: name,
          publishedAt: item.isoDate || item.pubDate,
          summary: stripHtml(item.contentSnippet || item.content || item.summary),
        })
      )
      .filter(Boolean);
  } catch (err) {
    console.warn(`RSS failed [${name}]:`, err.message);
    return [];
  }
}

async function fetchHackerNews() {
  const since = Math.floor(Date.now() / 1000) - 7 * 24 * 3600;
  const queries = ["AI", "LLM", "OpenAI", "machine learning"];
  const seen = new Set();
  const items = [];

  for (const query of queries) {
    try {
      const res = await fetch(
        `https://hn.algolia.com/api/v1/search?query=${encodeURIComponent(query)}&tags=story&numericFilters=created_at_i>${since}&hitsPerPage=10`
      );
      const data = await res.json();

      for (const hit of data.hits || []) {
        if (seen.has(hit.objectID)) continue;
        seen.add(hit.objectID);
        items.push(
          normalizeItem({
            title: hit.title,
            url: hit.url || `https://news.ycombinator.com/item?id=${hit.objectID}`,
            source: "Hacker News",
            publishedAt: new Date(hit.created_at).toISOString(),
            summary: `${hit.points || 0} points · ${hit.num_comments || 0} comments`,
          })
        );
      }
    } catch (err) {
      console.warn(`HN failed [${query}]:`, err.message);
    }
  }
  return items.filter(Boolean);
}

async function fetchArxivTrending() {
  try {
    const res = await fetch(
      "https://arxiv.org/search/?query=cat:cs.AI&searchtype=all&order=-announced_date_first&size=10",
      { headers: { "User-Agent": "AI-Daily-News/1.0" } }
    );
    const html = await res.text();
    const items = [];
    const titleRe = /<p class="title is-5 mathjax">\s*<a href="([^"]+)">([^<]+)<\/a>/g;
    let match;
    while ((match = titleRe.exec(html)) !== null && items.length < 10) {
      items.push(
        normalizeItem({
          title: match[2].trim(),
          url: `https://arxiv.org${match[1]}`,
          source: "arXiv",
          publishedAt: new Date().toISOString(),
          summary: "最新 AI 学术论文",
        })
      );
    }
    return items.filter(Boolean);
  } catch (err) {
    console.warn("arXiv scrape failed:", err.message);
    return [];
  }
}

function dedupeAndSort(items) {
  const seen = new Set();
  const unique = [];

  for (const item of items) {
    const key = item.url.replace(/\/$/, "").toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    unique.push(item);
  }

  return unique.sort(
    (a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
  );
}

async function main() {
  console.log("Fetching AI news from multiple sources...");

  const results = await Promise.all([
    ...RSS_FEEDS.map(fetchRssFeed),
    fetchHackerNews(),
    fetchArxivTrending(),
  ]);

  let allItems = results.flat();

  // For general tech feeds, keep only AI-related when source isn't AI-specific
  const aiSpecificSources = new Set(RSS_FEEDS.map((f) => f.name));
  allItems = allItems.filter((item) => {
    if (aiSpecificSources.has(item.source)) return true;
    return isAiRelated(`${item.title} ${item.summary}`);
  });

  const items = dedupeAndSort(allItems).slice(0, 120);

  const output = {
    updatedAt: new Date().toISOString(),
    count: items.length,
    items,
  };

  mkdirSync(dirname(OUTPUT), { recursive: true });
  writeFileSync(OUTPUT, JSON.stringify(output, null, 2), "utf-8");
  console.log(`Saved ${items.length} items to ${OUTPUT}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

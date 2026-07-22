const state = {
  items: [],
  activeSource: "all",
  query: "",
};

const els = {
  grid: document.getElementById("news-grid"),
  loading: document.getElementById("loading"),
  empty: document.getElementById("empty-state"),
  stats: document.getElementById("stats"),
  filters: document.getElementById("source-filters"),
  search: document.getElementById("search"),
  updateTime: document.getElementById("update-time"),
  githubLink: document.getElementById("github-link"),
};

function formatDate(iso) {
  const d = new Date(iso);
  const now = new Date();
  const diffMs = now - d;
  const diffH = Math.floor(diffMs / 3600000);

  if (diffH < 1) return "刚刚";
  if (diffH < 24) return `${diffH} 小时前`;
  if (diffH < 48) return "昨天";
  return d.toLocaleDateString("zh-CN", { month: "short", day: "numeric" });
}

function formatFullDate(iso) {
  return new Date(iso).toLocaleString("zh-CN", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function getSources(items) {
  const counts = {};
  for (const item of items) {
    counts[item.source] = (counts[item.source] || 0) + 1;
  }
  return Object.entries(counts).sort((a, b) => b[1] - a[1]);
}

function renderFilters() {
  const sources = getSources(state.items);
  els.filters.innerHTML = "";

  const allBtn = document.createElement("button");
  allBtn.className = `filter-chip${state.activeSource === "all" ? " active" : ""}`;
  allBtn.textContent = `全部 (${state.items.length})`;
  allBtn.onclick = () => { state.activeSource = "all"; render(); };
  els.filters.appendChild(allBtn);

  for (const [source, count] of sources) {
    const btn = document.createElement("button");
    btn.className = `filter-chip${state.activeSource === source ? " active" : ""}`;
    btn.textContent = `${source} (${count})`;
    btn.onclick = () => { state.activeSource = source; render(); };
    els.filters.appendChild(btn);
  }
}

function filteredItems() {
  return state.items.filter((item) => {
    if (state.activeSource !== "all" && item.source !== state.activeSource) return false;
    if (!state.query) return true;
    const q = state.query.toLowerCase();
    return (
      item.title.toLowerCase().includes(q) ||
      (item.summary || "").toLowerCase().includes(q) ||
      item.source.toLowerCase().includes(q)
    );
  });
}

function renderCards(items) {
  els.grid.innerHTML = items
    .map(
      (item, i) => `
    <article class="news-card" style="animation-delay:${Math.min(i * 0.03, 0.6)}s">
      <span class="card-source">${escapeHtml(item.source)}</span>
      <h2 class="card-title">
        <a href="${escapeAttr(item.url)}" target="_blank" rel="noopener noreferrer">${escapeHtml(item.title)}</a>
      </h2>
      ${item.summary ? `<p class="card-summary">${escapeHtml(item.summary)}</p>` : ""}
      <div class="card-meta">${formatDate(item.publishedAt)}</div>
    </article>`
    )
    .join("");
}

function escapeHtml(str) {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function escapeAttr(str) {
  return str.replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}

function render() {
  const items = filteredItems();
  renderFilters();
  els.stats.textContent = `共 ${items.length} 条资讯`;
  els.grid.classList.toggle("hidden", items.length === 0);
  els.empty.classList.toggle("hidden", items.length > 0);
  renderCards(items);
}

async function loadNews() {
  try {
    const res = await fetch("data/news.json?" + Date.now());
    if (!res.ok) throw new Error("Failed to load news");
    const data = await res.json();

    state.items = data.items || [];
    els.updateTime.textContent = `更新于 ${formatFullDate(data.updatedAt)}`;
    els.loading.classList.add("hidden");
    render();
  } catch (err) {
    els.loading.innerHTML = `<p>加载失败，请稍后刷新重试</p>`;
    console.error(err);
  }
}

els.search.addEventListener("input", (e) => {
  state.query = e.target.value.trim();
  render();
});

const repoMatch = document.querySelector('meta[name="github-repo"]');
if (repoMatch) {
  els.githubLink.href = repoMatch.content;
}

loadNews();

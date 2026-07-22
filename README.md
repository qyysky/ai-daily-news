# AI 每日热点

自动抓取全球 AI 新闻、博客与社区讨论的聚合网站，可免费部署在 GitHub Pages 上。

## 功能

- 每日自动抓取多个 AI 资讯源（RSS、Hacker News、Reddit）
- 支持按来源筛选、关键词搜索
- 深色现代 UI，移动端适配
- 完全免费，无需服务器

## 数据来源

| 来源 | 类型 |
|------|------|
| The Verge AI | RSS |
| VentureBeat AI | RSS |
| MIT Technology Review | RSS |
| Google AI Blog | RSS |
| OpenAI | RSS |
| Hugging Face | RSS |
| MarkTechPost | RSS |
| 量子位 | RSS |
| arXiv cs.AI | RSS |
| Hacker News | API |
| arXiv 最新论文 | 网页抓取 |

## 本地预览

```bash
npm install
npm run fetch          # 抓取最新资讯
npx serve .            # 启动本地服务器，访问 http://localhost:3000
```

## 部署到 GitHub Pages（免费）

### 1. 创建 GitHub 仓库

```bash
git remote add origin https://github.com/你的用户名/ai-daily-news.git
git push -u origin main
```

### 2. 开启 GitHub Pages

1. 进入仓库 **Settings → Pages**
2. **Source** 选择 **GitHub Actions**
3. 保存即可

### 3. 等待首次部署

推送代码后，Actions 会自动：
- 抓取最新 AI 资讯
- 更新 `data/news.json`
- 部署网站到 GitHub Pages

访问地址：`https://你的用户名.github.io/ai-daily-news/`

### 4. 手动触发更新

在 GitHub 仓库 **Actions** 页面，选择 **Update & Deploy**，点击 **Run workflow**。

## 自定义

- **添加资讯源**：编辑 `scripts/fetch-news.mjs` 中的 `RSS_FEEDS` 数组
- **修改更新频率**：编辑 `.github/workflows/deploy.yml` 中的 `cron` 表达式
- **修改样式**：编辑 `css/style.css`

## 技术栈

- 纯静态 HTML / CSS / JavaScript
- Node.js 抓取脚本 + rss-parser
- GitHub Actions 定时任务
- GitHub Pages 托管

## License

MIT

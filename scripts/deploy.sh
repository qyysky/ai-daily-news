#!/usr/bin/env bash
set -euo pipefail

REPO="qyysky/ai-daily-news"
ROOT="$(cd "$(dirname "$0")/.." && pwd)"

cd "$ROOT"

if ! command -v gh >/dev/null 2>&1; then
  echo "请先安装 GitHub CLI: brew install gh"
  exit 1
fi

if ! gh auth status >/dev/null 2>&1; then
  echo "请先登录 GitHub:"
  echo "  gh auth login"
  exit 1
fi

if ! gh repo view "$REPO" >/dev/null 2>&1; then
  echo "创建仓库 $REPO ..."
  gh repo create ai-daily-news --public --source=. --remote=origin --push --description "每日 AI 热点资讯聚合站"
else
  echo "推送代码到 $REPO ..."
  git push -u origin main
fi

echo ""
echo "请在 GitHub 开启 Pages："
echo "  1. 打开 https://github.com/$REPO/settings/pages"
echo "  2. Source 选择 GitHub Actions"
echo ""
echo "部署完成后访问："
echo "  https://qyysky.github.io/ai-daily-news/"

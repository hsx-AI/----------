#!/usr/bin/env bash
set -euo pipefail
cd -- "$(dirname -- "${BASH_SOURCE[0]}")"
BUNDLED_RUNTIME="/home/zns/.cache/codex-runtimes/codex-primary-runtime/dependencies"
if ! command -v node >/dev/null 2>&1 && [ -x "$BUNDLED_RUNTIME/node/bin/node" ]; then
  export PATH="$BUNDLED_RUNTIME/node/bin:$PATH"
fi
if command -v pnpm >/dev/null 2>&1; then
  PROJECT_PNPM="$(command -v pnpm)"
elif [ -x "$BUNDLED_RUNTIME/bin/fallback/pnpm" ]; then
  PROJECT_PNPM="$BUNDLED_RUNTIME/bin/fallback/pnpm"
else
  echo '未找到 pnpm。请先安装 Node.js 22.12+ 和 pnpm。'
  exit 1
fi
if [ ! -d node_modules ]; then
  "$PROJECT_PNPM" install
fi
exec "$PROJECT_PNPM" dev "$@"

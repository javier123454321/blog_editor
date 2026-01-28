#!/usr/bin/env bash
set -euo pipefail
IFS=$'\n\t'

# === Config (edit if needed) ===
DEPLOY_BASE="/var/www"
KEEP_RELEASES=5
CADDY_CONFIG="/etc/caddy/Caddyfile"
# By default do not invoke sudo (avoid password prompt during local dev). If you need privileged
# operations set SUDO=sudo in the environment when running the script on the server.
SUDO=${SUDO:-}
# logging helpers (needed early)
log() { printf '%s\n' ">> $*"; }
err() { printf '%s\n' "!! $*" >&2; }
timestamp() { date -u +%Y%m%d%H%M%S; }

# Ensure DEPLOY_BASE exists and is writable or that sudo is available when needed.
ensure_deploy_base() {
  # If SUDO is explicitly set in the environment, honor it. Otherwise prefer a local fallback
  # during development to avoid interactive password prompts.
  if [ -d "$DEPLOY_BASE" ]; then
    if [ -w "$DEPLOY_BASE" ]; then
      return 0
    fi
    # not writable
    if [ -n "${SUDO:-}" ]; then
      log "Note: $DEPLOY_BASE is not writable; using SUDO=$SUDO for privileged ops (may prompt)"
      return 0
    else
      # fallback to local deploy dir to avoid permission prompts during local development
      local fallback="$PWD/.local_www"
      log "$DEPLOY_BASE is not writable and SUDO not set; switching DEPLOY_BASE -> $fallback"
      DEPLOY_BASE="$fallback"
      mkdir -p "$DEPLOY_BASE"
      return 0
    fi
  else
    # try to create it
    if [ -n "${SUDO:-}" ]; then
      log "Creating $DEPLOY_BASE using SUDO=$SUDO"
      $SUDO mkdir -p "$DEPLOY_BASE"
      $SUDO chown "$(whoami)":"$(whoami)" "$DEPLOY_BASE" || true
    else
      # create local path instead of requiring sudo
      log "Creating local deploy base $DEPLOY_BASE"
      mkdir -p "$DEPLOY_BASE"
    fi
  fi
}

# Make sure deploy base exists and set SUDO if needed
ensure_deploy_base


# Run a command only if npm is available
run_npm() {
  if command -v npm >/dev/null 2>&1; then
    "$@"
  else
    log "npm not found; skipping: $*"
  fi
}

# Apps mapping: app name -> source dir (relative to repo) and port
# Adjusted based on repo structure analysis:
# 'editor' appears to be the frontend in the "editor" directory (package.json name "blog-editor-frontend")
# 'editor-server' appears to be the backend in the root directory (based on root package.json "main": "editor-server.js")
# We will treat the root as "editor-server" source, and "editor" dir as "editor" source.
declare -A APP_SRC=(
  ["editor"]="editor"
  ["editor-server"]="." 
)
declare -A APP_PORT=(
  ["editor"]="5555"
  ["editor-server"]="6666"
)

SERVICE_SUFFIX=".service"


detect_mode() {
  local src="$1"
  if [ -f "$src/package.json" ]; then
    if grep -q '"build"' "$src/package.json" 2>/dev/null; then
      echo "static"; return
    fi
    if [ -f "$src/server.js" ] || [ -f "$src/index.js" ] || [ -f "$src/editor-server.ts" ] || grep -q '"express"' "$src/package.json" 2>/dev/null; then
      echo "node"; return
    fi
  fi
  for d in dist build public; do
    if [ -d "$src/$d" ]; then
      echo "static"; return
    fi
  done
  if [ -f "$src/server.js" ] || [ -f "$src/index.js" ] || [ -f "$src/editor-server.ts" ]; then
    echo "node"
  else
    echo "static"
  fi
}

# Copy tree fallback when rsync isn't available. Expects a list of exclude names after dest.
copy_tree() {
  local src="$1" dst="$2"
  shift 2
  local excludes=("$@")
  mkdir -p "$dst"
  if command -v rsync >/dev/null 2>&1; then
    local args=( -a --delete )
    for e in "${excludes[@]}"; do args+=( --exclude "$e" ); done
    rsync "${args[@]}" "$src/" "$dst/"
    return
  fi
  # Fallback: use tar to copy while excluding patterns
  local tar_args=()
  for e in "${excludes[@]}"; do tar_args+=( --exclude "$e" ); done
  (cd "$src" && tar cf - "${tar_args[@]}" .) | (cd "$dst" && tar xpf -)
}

# Run tests in non-interactive mode. Avoid watch mode (vitest/jest) by passing run flags when detected.
run_tests() {
  local src="$1"
  # prefer npx vitest --run if vitest is in package.json
  if [ -f "$src/package.json" ] && grep -q '"vitest"' "$src/package.json" 2>/dev/null; then
    log "Running vitest --run for $src (if npx is available)"
    if command -v npx >/dev/null 2>&1; then
      (cd "$src" && npx --yes vitest --run)
    else
      log "npx not found; skipping vitest run"
    fi
    return
  fi
  # Run tests under CI environment to avoid watch mode
  if [ -f "$src/package.json" ]; then
    log "Running npm test (CI mode) for $src"
    (cd "$src" && CI=1 npm test --silent) || true
  fi
}

run_lint() {
  local src="$1"
  if [ -f "$src/package.json" ] && grep -q '"lint"' "$src/package.json" 2>/dev/null; then
    log "Running npm run lint for $src"
    (cd "$src" && npm run lint) || true
  fi
}

find_build_dir() {
  local src="$1"
  for d in dist build public; do
    if [ -d "$src/$d" ]; then
      printf '%s' "$src/$d"; return
    fi
  done
  printf ''
}

make_release_dir() {
  local app="$1" ts
  ts=$(timestamp)
  local release_dir="$DEPLOY_BASE/$app/releases/$ts"
  $SUDO mkdir -p "$release_dir"
  $SUDO chown "$(id -un):$(id -gn)" "$release_dir"
  printf '%s' "$release_dir"
}

activate_current() {
  local app="$1" release_dir="$2" current_dir="$DEPLOY_BASE/$app/current"
  # try to create symlink; if that fails due to permissions, fallback to local deploy base
  if { [ -n "${SUDO:-}" ] && $SUDO ln -sfn "$release_dir" "$current_dir"; } || { [ -z "${SUDO:-}" ] && ln -sfn "$release_dir" "$current_dir"; }; then
    if [ -n "${SUDO:-}" ]; then
      $SUDO chown -R "$(whoami)":"$(whoami)" "$DEPLOY_BASE/$app/releases" || true
    else
      chown -R "$(whoami)":"$(whoami)" "$DEPLOY_BASE/$app/releases" 2>/dev/null || true
    fi
    return 0
  fi

  err "Failed to create symlink at $current_dir (permission denied). Falling back to local deploy directory."
  local fallback_base="$PWD/.local_www"
  local fallback_release="$fallback_base/$app/releases/$(timestamp)"
  mkdir -p "$fallback_release"
  log "Copying release to local fallback: $fallback_release"
  copy_tree "$release_dir" "$fallback_release"
  ln -sfn "$fallback_release" "$fallback_base/$app/current"
  DEPLOY_BASE="$fallback_base"
}

prune_releases() {
  local app="$1" releases_dir="$DEPLOY_BASE/$app/releases"
  [ -d "$releases_dir" ] || return
  local to_delete
  to_delete=$(ls -1dt "$releases_dir"/* 2>/dev/null || true)
  local arr=()
  while IFS= read -r p; do arr+=("$p"); done <<<"$to_delete"
  local count=${#arr[@]}
  if [ "$count" -le "$KEEP_RELEASES" ]; then return; fi
  local i
  for ((i=KEEP_RELEASES;i<count;i++)); do
    log "Pruning old release: ${arr[i]}"
    rm -rf "${arr[i]}"
  done
}

rollback_app() {
  local app="$1" releases_dir="$DEPLOY_BASE/$app/releases"
  [ -d "$releases_dir" ] || { err "No releases to rollback for $app"; return 1; }
  IFS=$'\n' read -r -d '' -a rels < <(ls -1dt "$releases_dir"/* 2>/dev/null && printf '\0')
  if [ "${#rels[@]}" -lt 2 ]; then err "No previous release to rollback to for $app"; return 1; fi
  local prev="${rels[1]}"
  log "Rolling back $app -> $prev"
  ln -sfn "$prev" "$DEPLOY_BASE/$app/current"
}

caddy_reload() {
  if [ -z "${SUDO:-}" ]; then
    log "SUDO not set; skipping caddy validate/reload (running locally)."
    return 0
  fi
  if $SUDO caddy validate --config "$CADDY_CONFIG"; then
    $SUDO systemctl reload caddy
  else
    err "Caddy validation failed"
    return 1
  fi
}

smoke_check() {
  local app="$1" mode="$2" port="${APP_PORT[$app]}" current="$DEPLOY_BASE/$app/current"
  if [ "$mode" = "node" ]; then
    sleep 1
    local code
    code=$($SUDO curl -sS -o /dev/null -w '%{http_code}' --max-time 5 "http://127.0.0.1:${port}/" || true)
    if [ "$code" = "200" ] || [ -n "$code" -a "$code" -lt 400 ]; then
      log "Smoke OK: $app (http://127.0.0.1:${port}/) -> $code"
      return 0
    else
      err "Smoke FAILED for $app -> HTTP $code"
      return 1
    fi
  else
    if [ -f "$current/index.html" ]; then
      log "Smoke OK: $app static index found"
      return 0
    else
      err "Smoke FAILED for $app: index.html missing in $current"
      return 1
    fi
  fi
}

deploy_one() {
  local app="$1" src="${APP_SRC[$app]:-}"
  [ -n "$src" ] || { err "Unknown app: $app"; return 1; }
  [ -d "$src" ] || { err "Source dir missing: $src"; return 1; }

  local mode
  mode=$(detect_mode "$src")
  log "Deploying $app (mode=$mode) from $src"

  if [ -f "$src/package.json" ]; then
     # Run tests and lint in non-watch mode where possible (skip during local dev by setting SKIP_TESTS=1)
     if [ -z "${SKIP_TESTS:-}" ]; then
       run_tests "$src" || true
     else
       log "SKIP_TESTS set; skipping tests for $src"
     fi
     run_lint "$src" || true

     if grep -q '"build"' "$src/package.json" 2>/dev/null; then
       log "Running npm install && npm run build for $app"
       (cd "$src" && run_npm npm install && run_npm npm run build)
     fi
  fi

  local release_dir
  release_dir=$(make_release_dir "$app")

  # ensure release_dir exists and has correct ownership
  if [ ! -d "$release_dir" ]; then
    if [ -n "$SUDO" ]; then
      $SUDO mkdir -p "$release_dir"
      $SUDO chown "$(whoami)":"$(whoami)" "$release_dir" || true
    else
      mkdir -p "$release_dir"
    fi
  fi

  if [ "$mode" = "static" ]; then
    local bd
    bd=$(find_build_dir "$src")
    if [ -z "$bd" ]; then
      log "No build dir found; copying $src -> $release_dir"
      copy_tree "$src" "$release_dir" "node_modules" ".git" "releases" "current"
    else
      log "Copying build output $bd -> $release_dir"
      copy_tree "$bd" "$release_dir"
    fi
  else
    log "Copying project files $src -> $release_dir (excluding node_modules, .git)"
    # Exclude typical unnecessary directories for a Node app
    copy_tree "$src" "$release_dir" "node_modules" ".git" "releases" "current" "editor"
    local port="${APP_PORT[$app]}"
    echo "PORT=${port:-3000}" > "$release_dir/.env"
    echo "NODE_ENV=production" >> "$release_dir/.env"
    # Install production dependencies
    # Ensure package.json is present in the release (some copy fallbacks may miss it)
    if [ ! -f "$release_dir/package.json" ] && [ -f "$src/package.json" ]; then
      cp "$src/package.json" "$release_dir/"
    fi
    if [ ! -f "$release_dir/package-lock.json" ] && [ -f "$src/package-lock.json" ]; then
      cp "$src/package-lock.json" "$release_dir/"
    fi
    (cd "$release_dir" && npm install --omit=dev --no-audit --no-fund)
  fi

  activate_current "$app" "$release_dir"

  if [ "$mode" = "node" ]; then
    log "Restarting systemd service: ${app}${SERVICE_SUFFIX}"
    $SUDO systemctl daemon-reload || true
    if $SUDO systemctl restart "${app}${SERVICE_SUFFIX}" 2>/dev/null; then
      log "Service restarted: ${app}${SERVICE_SUFFIX}"
    else
      err "Service ${app}${SERVICE_SUFFIX} not found or failed to start; skipping restart"
    fi
  fi
}

deploy_apps() {
  local apps=("$@") deployed=()
  for app in "${apps[@]}"; do
    if deploy_one "$app"; then
      deployed+=("$app")
    else
      err "Deploy failed for $app -> attempting rollback for apps deployed so far"
      for a in "${deployed[@]}"; do rollback_app "$a" || true; done
      return 1
    fi
  done

  if ! caddy_reload; then
    err "Caddy reload failed -> rolling back all deployed apps"
    for a in "${deployed[@]}"; do rollback_app "$a" || true; done
    $SUDO systemctl reload caddy || true
    return 1
  fi

  for app in "${deployed[@]}"; do
    local mode
    mode=$(detect_mode "${APP_SRC[$app]}")
    if ! smoke_check "$app" "$mode"; then
      err "Smoke check failed for $app -> rolling back all deployed apps"
      for a in "${deployed[@]}"; do rollback_app "$a" || true; done
      caddy_reload || true
      return 1
    fi
  done

  for app in "${deployed[@]}"; do prune_releases "$app" || true; done

  log "Deployment complete for: ${deployed[*]}"
}

usage() {
  cat <<EOF
Usage: $0 <command> [app]
Commands:
  deploy [editor|editor-server|all]   Build & deploy apps (default: all)
  rollback <app>                      Rollback <app> to previous release
  prune <app>                         Prune old releases for <app>
  status <app>                        Show current release for <app>
EOF
  exit 1
}

cmd=${1:-deploy}
target=${2:-all}

case "$cmd" in
  deploy)
    apps_to_run=()
    if [ "$target" = "all" ]; then
      for k in "${!APP_SRC[@]}"; do apps_to_run+=("$k"); done
    else
      apps_to_run+=("$target")
    fi
    deploy_apps "${apps_to_run[@]}"
    ;;
  rollback)
    if [ -z "${target:-}" ] || [ "$target" = "all" ]; then err "Please specify an app to rollback"; usage; fi
    rollback_app "$target"
    caddy_reload || true
    ;;
  prune)
    if [ -z "${target:-}" ] || [ "$target" = "all" ]; then err "Please specify an app to prune"; usage; fi
    prune_releases "$target"
    ;;
  status)
    if [ -z "${target:-}" ] || [ "$target" = "all" ]; then err "Please specify an app"; usage; fi
    echo "CURRENT -> $DEPLOY_BASE/$target/current"
    ls -l "$DEPLOY_BASE/$target/current" || true
    ;;
  *)
    usage
    ;;
esac

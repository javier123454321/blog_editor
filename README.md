# Blog Editor

Visual markdown editor for an 11ty blog with local git ops and GitHub PR creation.

Monorepo layout:

- `packages/server` — Express API on **Bun**
- `packages/web` — Vue 3 + Vite + **Nuxt UI** (`UEditor` for visual markdown)
- `blog/` — git submodule with site content

## Prerequisites

- [mise](https://mise.jdx.dev/) (installs Bun)
- Git

```bash
mise install
mise run install   # or: bun install
git submodule update --init --recursive
```

## Configuration

```bash
cp .env.example .env
```

Set `BLOG_EDITOR_PASSWORD_HASH` to a SHA-256 hex digest of your password:

```bash
echo -n "your_password" | shasum -a 256
```

Optional GitHub PR support:

- `GITHUB_TOKEN`
- `GITHUB_REPO_OWNER`
- `GITHUB_REPO_NAME`

## Develop

```bash
mise run dev
# or separately:
# mise run dev:server   # http://localhost:3001
# mise run dev:web      # http://localhost:5173
```

Open the URL from the web task (default `http://localhost:5173`). The Vite dev server proxies `/api` → the API.

## Scripts

| Command | Description |
|---------|-------------|
| `mise run install` | `bun install` workspaces |
| `mise run dev` | API + web |
| `mise run build` | Build packages |
| `mise run test` | Unit tests |
| `mise run typecheck` | TypeScript check |

## API (auth)

Most routes require header `X-Auth-Password: <plaintext password>`.

| Method | Path | Purpose |
|--------|------|---------|
| POST | `/auth` | Verify password |
| GET | `/files` | List markdown files |
| GET/POST | `/file?path=` | Read / write file |
| GET | `/branches` | List branches |
| POST | `/checkout` | Switch branch |
| POST | `/branch/create` | Create branch |
| POST | `/commit` | Commit working tree |
| POST | `/push` | Push |
| POST | `/pr` | Create or update PR |

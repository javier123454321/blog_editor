# AGENTS.prod.md — Blog Editor Production Deployment

This file documents the production deployment of `blog_editor` on `hp-box`.
Referenced from `AGENTS.md`.

## Architecture Overview

```
Internet / Phone
      │
      ▼
Tailscale Funnel (TLS terminated by Tailscale)
      │
      ├── https://hp-box.tail8038b1.ts.net       → port 3001 (blog editor app)
      └── https://hp-box.tail8038b1.ts.net:8443  → port 5178 (blog preview server)
```

## Services

### blog-editor (port 3001)
- **Systemd unit:** `~/.config/systemd/user/blog-editor.service`
- **What it does:** Express server serving both the SPA static files and the API
- **Repo:** `/home/javi/blog_editor`
- **Start:** `systemctl --user start blog-editor`
- **Restart:** `systemctl --user restart blog-editor`
- **Logs:** `journalctl --user -u blog-editor -f`

### blog-preview (port 5178)
- **Systemd unit:** `~/.config/systemd/user/blog-preview.service`
- **What it does:** Eleventy + Vite dev server for the blog — used as the live preview iframe inside the editor
- **Repo:** `/home/javi/blog_editor/blog`
- **Start:** `systemctl --user start blog-preview`
- **Restart:** `systemctl --user restart blog-preview`
- **Logs:** `journalctl --user -u blog-preview -f`

## Funnel Configuration

Managed by Tailscale. To check:
```bash
tailscale funnel status
```

To re-enable if lost (e.g. after Tailscale re-auth):
```bash
tailscale funnel --bg 3001
tailscale funnel --bg --https=8443 5178
```

## Environment

`.env` at repo root (`/home/javi/blog_editor/.env`):
```
PORT=3001
GITHUB_REPO_OWNER=javier123454321
GITHUB_REPO_NAME=blog
BLOG_EDITOR_PASSWORD_HASH=<sha256 of password>
VITE_BLOG_PREVIEW_URL=https://hp-box.tail8038b1.ts.net:8443
```

`packages/web/.env` (Vite build-time):
```
VITE_BLOG_PREVIEW_URL=https://hp-box.tail8038b1.ts.net:8443
```

> ⚠️ `VITE_BLOG_PREVIEW_URL` must be set in **both** `.env` and `packages/web/.env`.
> The root `.env` is runtime only; Vite bakes the value at build time from `packages/web/.env`.

## Deploy / Update Procedure

```bash
cd /home/javi/blog_editor
git pull
mise run install
mise run build
systemctl --user restart blog-editor
```

No need to restart `blog-preview` unless the blog submodule changed.

## Password Management

To change the password:
```bash
echo -n "YourNewPassword" | shasum -a 256
# Update BLOG_EDITOR_PASSWORD_HASH in .env with the hash
systemctl --user restart blog-editor
```

## DNS

Managed via Netlify DNS on `javiergonzalez.io` zone:

| Hostname | Type | Value |
|---|---|---|
| `admin.javiergonzalez.io` | CNAME | `hp-box.tail8038b1.ts.net` |
| `hp-net.javiergonzalez.io` | CNAME | `hp-box.tail8038b1.ts.net` |

> ⚠️ These CNAMEs resolve correctly but TLS will fail for external clients since the
> Tailscale Funnel cert only covers `*.tail8038b1.ts.net`. They work fine from within
> the tailnet where clients can tolerate or bypass the SNI mismatch.
> Use `https://hp-box.tail8038b1.ts.net` directly for reliable access.

## Known Limitations

- **Custom domain TLS:** Tailscale Funnel only issues certs for `*.tail8038b1.ts.net`.
  A custom domain like `admin.javiergonzalez.io` requires either open port 443 + Caddy,
  or Cloudflare Tunnel.
- **Preview server is dev mode:** The blog preview runs eleventy in watch/incremental mode.
  It's not a production build — intentional for live preview in the editor.
- **Tailscale re-auth:** If Tailscale logs out, both funnels go down. Re-run
  `tailscale up` and re-enable funnels.

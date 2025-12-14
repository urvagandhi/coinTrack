# 🚀 Deployment Guide

This guide ensures a safe and predictable deployment of the CoinTrack Frontend.

## 📦 Build Artifacts

We use **Next.js Standalone Mode**.

- **Command**: `npm run build`
- **Output**: `.next/standalone`
- **Artifacts**:
  - Optimized JS/CSS bundles.
  - Static HTML for non-dynamic routes.
  - A minimal Node.js server server file.

## 🛠️ Environment Variables

Production environments **MUST** have these variables defined.

| Variable | Description | Example |
| :--- | :--- | :--- |
| `NEXT_PUBLIC_API_BASE` | URL of the Backend API | `https://api.cointrack.com` |
| `NODE_ENV` | Mode | `production` |

*> Note: `NEXT_PUBLIC_` variables are baked into the build time. You must rebuild if these change.*

## 🐳 Docker Deployment

The `next.config.mjs` is configured with `output: "standalone"`.

**Dockerfile Snippet:**
```dockerfile
# ... build stage ...
RUN npm run build

# ... runner stage ...
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public

EXPOSE 3000
CMD ["node", "server.js"]
```

## ✅ Pre-Flight Checklist

Before complying the build to production, verify:
1.  **Linting**: `npm run lint` passes (Strict rules).
2.  **Build**: `npm run build` exits with Code 0.
3.  **Logs**: Inspect `logger.js` output locally to ensure debug logs are not flooding.
4.  **Config**: Ensure `api.js` connects to the PROD backend, not localhost.

## 🚨 Troubleshooting

**Issue: "404 on API calls"**
- Check `NEXT_PUBLIC_API_BASE`.
- Ensure Nginx/LoadBalancer handles `/api` rewrites if you aren't using the internal Next.js rewriter.

**Issue: "Infinite Redirect Loop"**
- Check `AuthContext`. If `/api/users/me` 401s, it redirects to login. Use `logger` to trace why the token is rejected.

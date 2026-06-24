## Netlify Deploy Checklist

When opening a PR intended for `main` and Netlify automatic deploys:

- [ ] Confirm `netlify.toml` build command is unchanged (`npm ci && npm run build`).
- [ ] Ensure `@netlify/plugin-nextjs` is present in `devDependencies`.
- [ ] Set `FIREBASE_SERVICE_ACCOUNT` in Netlify site environment variables (base64-encoded or raw JSON). See `NETLIFY_FIREBASE_ADMIN_SETUP.md` for details.
- [ ] If adding server-side Firebase Admin code, ensure it's only imported in server routes (avoid client bundles).
- [ ] Verify production-only secrets are not committed to the repo.
- [ ] After merge, confirm Netlify deployment logs show Admin SDK initialized without errors and call a smoke endpoint (e.g., `POST /api/products/create`) with a valid ID token to verify.

Notes:
- If you cannot set the env var in Netlify prior to the PR, add a comment in the PR describing the steps required to finalize deployment.

Netlify: Configure Firebase Admin for Serverless Routes

1) Obtain service account JSON
- In Google Cloud Console (IAM & Admin → Service Accounts), create a service account with `Firebase Admin` privileges.
- Generate a JSON key and download it.

2) Add to Netlify environment variables
- Recommended: base64-encode the JSON to avoid multiline issues.

  ```bash
  cat serviceAccountKey.json | base64 | tr -d '\n' > sa.b64
  # Copy the contents of sa.b64 and add to Netlify as the value
  ```

- In Netlify UI: Site settings → Build & deploy → Environment → Edit variables
  - Add `FIREBASE_SERVICE_ACCOUNT` with the base64 value from `sa.b64` (or paste raw JSON if preferred).
  - Add any other required variables (e.g., `NEXT_PUBLIC_FIREBASE_API_KEY`, etc.).

3) Local development
- For local dev you can set `FIREBASE_SERVICE_ACCOUNT` in your shell (PowerShell example):

  ```powershell
  $b64 = Get-Content .\serviceAccountKey.json -Raw | Out-String | ForEach-Object { [Convert]::ToBase64String([Text.Encoding]::UTF8.GetBytes($_)) }
  setx FIREBASE_SERVICE_ACCOUNT $b64
  ```

- Alternatively, run the dev server with the env var inline (Git Bash / WSL):

  ```bash
  export FIREBASE_SERVICE_ACCOUNT=$(cat serviceAccountKey.json | base64 -w0)
  npm run dev
  ```

4) Verify Admin route availability
- After Netlify deploy, confirm `POST /api/products/create` returns 200 when called with a valid ID token.
- In dev, you may get 501 if `FIREBASE_SERVICE_ACCOUNT` is not set.

5) Security notes
- Keep the service account JSON secret. Use base64 to avoid accidental line breaks during CI/CD variable entry.
- Restrict the service account's permissions to only what's necessary (Firestore write, Auth verify).

6) Troubleshooting
- 501 from `/api/products/create`: check `FIREBASE_SERVICE_ACCOUNT` presence in Netlify environment variables.
- 401/403 from Admin verify: ensure the ID token is valid and belongs to the same Firebase project as the service account.
- Logs: check Netlify function logs for initialization errors.

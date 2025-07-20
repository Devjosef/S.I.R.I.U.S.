# Security and Privacy in S.I.R.I.U.S.

## Privacy-First by Design
- All your data stays on your device—nothing is sent to the cloud or third parties.
- No external authentication or tracking is used.
- You control all integrations and data sharing.

## Data Storage and Protection
- User data is stored in local JSON files (see `data/memory/`).
- Sensitive data (API keys, tokens) is kept in your local `.env` file.
- You can delete or back up your data at any time.

## Security Middleware
- S.I.R.I.U.S. includes built-in security features:
  - Rate limiting to prevent abuse
  - Input validation to block malicious data
  - CORS and local-only API access
- See `src/middleware/security.js` and `src/middleware/validator.js` for details.

## Running Fully Offline
- All core features (AI, memory, recommendations) work offline after initial setup.
- You can disconnect from the internet for maximum privacy.

## Auditing and Clearing Data
- To audit your data, review the files in `data/memory/` and your `.env` file.
- To clear all user data, delete the contents of `data/memory/`.
- To remove integrations, clear your `.env` file.

## Non-Obvious Privacy Features
- No analytics, telemetry, or error reporting is sent externally.
- All AI processing (Ollama) is local and private.
- You can inspect, edit, or delete any part of your data at any time.

---

For more details, see the main README and the middleware code in `src/middleware/`. 
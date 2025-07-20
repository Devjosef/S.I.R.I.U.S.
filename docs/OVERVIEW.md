# S.I.R.I.U.S. System Overview

## What is S.I.R.I.U.S.?
S.I.R.I.U.S. (Smart Intelligent Responsive Interface for Universal Support) is a privacy-first, offline-capable AI assistant that runs entirely on your local machine. It helps you manage tasks, emails, calendars, and more—while keeping all your data secure, private, and under your control. No data is sent to the cloud or third parties.

## Privacy-First, Local-First Philosophy
- **All data and AI processing happens locally**. Your information never leaves your device.
- **No external authentication**: All APIs are local, and there is no dependency on cloud-based auth or storage.
- **Encrypted local storage**: Sensitive data is stored in local JSON files (see `data/memory/`).

## User Memory and Learning
- S.I.R.I.U.S. learns from your real usage patterns, storing them in the `data/memory/` directory.
- Each user has a separate memory file (JSON) that tracks:
  - Task and event history
  - Circadian rhythm patterns (when you are most active)
  - Preferences and context
- The system uses this memory to make personalized recommendations and predictions.
- **To reset learning**, simply delete or clear files in `data/memory/`.

## Local AI with Ollama
- S.I.R.I.U.S. uses [Ollama](https://ollama.ai/) as a local AI engine for all natural language processing and ML predictions.
- No internet connection is required for AI features once models are downloaded.
- Ollama is used for:
  - Summarizing emails and events
  - Generating daily digests
  - Extracting intent from user input
  - Powering advanced recommendations

## Circadian Rhythm and Pattern Learning
- The system analyzes your activity timestamps to determine if you are a "morning person," "evening person," or "night owl."
- This is used to optimize recommendations and scheduling.
- The logic is in `memoryService.js` and `predictionService.js`.
- You can view or reset your circadian data in your user memory file.

## Integrations (Google, Asana, Jira, Trello, etc.)
- Integrations are handled by dedicated services in `src/services/` (e.g., `googleWorkspaceService.js`, `asanaService.js`).
- API keys for integrations are stored locally in your `.env` file.
- You can enable/disable integrations by editing your config or environment variables.
- Each integration is modular—new ones can be added by creating a new service and route.

## Worker Threads and Background Processing
- CPU-intensive tasks (like AI inference, large data processing) are handled by worker threads (see `workers/` and `workerManager.js`).
- This keeps the main app responsive and efficient, even on lower-powered devices.

## Extending the System
- **To add a new integration:**
  1. Create a new service in `src/services/`
  2. Add corresponding routes in `src/routes/`
  3. Update the UI or API as needed
- **To add new learning or analytics:**
  - Extend `memoryService.js` or `learningAnalyticsService.js`
- **To add new background tasks:**
  - Add a new worker in `workers/` and register it in `workerManager.js`

## Security and Privacy Features (Non-Obvious)
- All sensitive operations are local; no third-party analytics or telemetry.
- Rate limiting and security middleware are included (see `src/middleware/security.js`).
- You can run the system fully offline after initial setup.

## Configuration and Data Reset
- Main configuration is in `src/config/` and your `.env` file.
- To reset all user data and learning, clear the `data/memory/` directory.
- To remove API keys or integrations, edit your `.env` file.

---

For more details, see the other docs in this folder or the main README. 
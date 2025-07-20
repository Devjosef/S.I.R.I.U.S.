# Root Files and Meta Files Explained

This document explains the purpose of some important files and folders in the root of the S.I.R.I.U.S. project that may not be obvious to new users or contributors.

---

## `replit.nix`
- **Purpose:** Provides a Nix-based environment definition for [Replit](https://replit.com/) online IDE.
- **Why is it here?**
  - Allows anyone to instantly run and develop S.I.R.I.U.S. in the Replit cloud environment.
  - Ensures all dependencies are installed and the environment matches local development.
- **Safe to ignore if not using Replit.**

## `sw.js`
- **Purpose:** Service Worker script for the web app.
- **Why is it here?**
  - Enables offline support, background sync, and advanced caching for the S.I.R.I.U.S. web interface.
  - Handles push notifications and makes the app behave like a Progressive Web App (PWA).
- **Used by:** Browsers that support service workers (registered in the web app).

## `workbox-config.js`
- **Purpose:** Configuration file for [Workbox](https://developer.chrome.com/docs/workbox/), a library for building service workers.
- **Why is it here?**
  - Defines which files and routes should be cached, how updates are handled, and other PWA behaviors.
  - Used during the build process to generate an optimized service worker.

## `manifest.json` (root)
- **Purpose:** Web App Manifest for PWA support.
- **Why is it here?**
  - Provides metadata (name, icons, theme color, etc.) so S.I.R.I.U.S. can be installed to a home screen or run as a standalone app.
  - Required for full PWA functionality in browsers.

## `browser-extension/manifest.json`
- **Purpose:** Chrome/Edge extension manifest.
- **Why is it here?**
  - Defines permissions, background scripts, icons, and other settings for the browser extension version of S.I.R.I.U.S.
  - Required by Chrome, Edge, and other Chromium-based browsers to load the extension.

## `run.sh`, `setup.sh`, `setup-n8n.sh`, `setup-native.sh`
- **Purpose:** Shell scripts for setup and running the project.
- **Why are they here?**
  - `run.sh`: Starts the main S.I.R.I.U.S. server or app.
  - `setup.sh`: Installs dependencies and prepares the environment.
  - `setup-n8n.sh`: Sets up the n8n workflow automation integration.
  - `setup-native.sh`: Prepares the mobile app for native builds.
- **Safe to inspect or run as needed for your platform.**

## `package.json`, `package-lock.json`
- **Purpose:** Node.js project metadata and dependency management.
- **Why are they here?**
  - `package.json`: Lists dependencies, scripts, and project info.
  - `package-lock.json`: Locks exact versions for reproducible installs.

## `README.md`
- **Purpose:** Main project documentation and quick start guide.

---

If you see a file in the root and aren't sure what it does, check here or ask in project discussions! 
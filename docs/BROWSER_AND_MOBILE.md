# Browser Extension and Mobile App

This document explains the purpose, setup, and structure of the browser extension and mobile app in S.I.R.I.U.S.

---

## Browser Extension

### What does it do?
- Provides quick access to S.I.R.I.U.S. features directly from your browser (Chrome, Edge, etc.).
- Lets you interact with tasks, notifications, and integrations without opening the main web app.
- Can show reminders, summaries, and context-aware actions while you browse.

### Where is the code?
- All extension code is in the `browser-extension/` folder.
  - `background.js`: Background logic and event handling
  - `popup/`: UI for the extension popup
  - `manifest.json`: Extension metadata and permissions
  - `js/`, `css/`, `icons/`: Supporting scripts, styles, and icons

### How to install/use?
1. Go to your browser's extension management page (e.g., `chrome://extensions/`).
2. Enable "Developer mode".
3. Click "Load unpacked" and select the `browser-extension/` folder.
4. The S.I.R.I.U.S. icon will appear in your browser toolbar.

### Special notes
- Some features may require permissions (e.g., notifications, reading tabs).
- The extension communicates with the main S.I.R.I.U.S. backend via local APIs or WebSocket.
- You can customize or extend the extension by editing files in `browser-extension/`.
- **There is no automated test or lint setup for the extension. The best way to confirm it works is to load it in your browser and try it out. Check the browser console for any errors.**

---

## Mobile App

### What does it do?
- Lets you use S.I.R.I.U.S. on your phone or tablet (Android/iOS).
- Supports offline access, notifications, and mobile-friendly UI.
- Integrates with device features (calendar, notifications, etc.) where possible.

### Where is the code?
- All mobile code is in the `mobile-app/` folder.
  - `App.js`: Main entry point
  - `src/`: App logic and services
  - `package.json`: Dependencies and scripts
  - `setup-native.sh`, `setup.sh`: Setup scripts

### How to run/build?
1. Install dependencies:
   ```bash
   cd mobile-app
   npm install
   ```
2. Start the app (for development):
   ```bash
   npm start
   # Or use Expo/React Native CLI as needed
   ```
3. For native builds, follow the instructions in `setup-native.sh` and the React Native docs.

### Special notes
- The mobile app connects to your local S.I.R.I.U.S. backend via API or WebSocket.
- Some features may require device permissions (notifications, calendar, etc.).
- You can extend the app by adding new screens or services in `mobile-app/src/`.
- **There is no automated end-to-end test for the mobile app. The best way to confirm it works is to run it in an emulator or on a real device and interact with the UI.**

---

## Contributing or Extending
- Both the browser extension and mobile app are modular and can be extended independently.
- To add new features, edit the relevant files in `browser-extension/` or `mobile-app/`.
- For cross-platform features, ensure the backend API supports the needed functionality.

If you have questions or want to contribute, check the README or ask in project discussions! 
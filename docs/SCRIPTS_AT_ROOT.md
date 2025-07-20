# Root Shell Scripts Explained

This document explains the purpose and usage of each shell script found at the root of the S.I.R.I.U.S. project.

---

## `run.sh`
- **Purpose:** Starts the main S.I.R.I.U.S. server or application.
- **When to use:**
  - Use this script to launch the backend/server for S.I.R.I.U.S. after setup is complete.
  - Typically run with `./run.sh` from the project root.

## `setup.sh`
- **Purpose:** Installs dependencies and prepares the environment for development or production.
- **When to use:**
  - Run this script after cloning the repository to set up everything needed to start the project.
  - Installs Node.js dependencies and may perform other setup tasks.
  - Run with `./setup.sh` from the project root.

## `setup-n8n.sh`
- **Purpose:** Sets up the n8n workflow automation integration.
- **When to use:**
  - If you want to use n8n (a workflow automation tool) with S.I.R.I.U.S., run this script.
  - It will install and configure n8n as needed.
  - Run with `./setup-n8n.sh` from the project root.

## `setup-native.sh`
- **Purpose:** Prepares the mobile app for native builds (Android/iOS).
- **When to use:**
  - If you want to build or run the mobile app natively (not just in a web view or emulator), run this script inside the `mobile-app/` directory.
  - It installs native dependencies and sets up the environment for React Native builds.
  - Run with `./setup-native.sh` from the `mobile-app/` directory.

---

If you are unsure about a script, open it in a text editor to review what it does, or ask in project discussions before running it. 
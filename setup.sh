#!/bin/bash

# S.I.R.I.U.S. Setup Script
# This script sets up the S.I.R.I.U.S. project environment

echo "========================================================="
echo "  S.I.R.I.U.S. Setup"
echo "  SMART, INTELLIGENT, RESPONSIVE, INTEGRATIVE, USER-FRIENDLY, SYSTEM"
echo "========================================================="

# Check if running on Replit
if [ -n "$REPL_ID" ]; then
    echo "Running on Replit environment ✅"
    IS_REPLIT=true
else
    echo "Running on local environment ✅"
    IS_REPLIT=false
fi

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "Node.js is not installed. Please install Node.js first."
    echo "Visit https://nodejs.org/ to download and install."
    exit 1
fi

# Check Node.js version
NODE_VERSION=$(node -v | cut -d 'v' -f 2)
NODE_MAJOR=$(echo $NODE_VERSION | cut -d '.' -f 1)

if [ $NODE_MAJOR -lt 18 ]; then
    echo "Node.js version 18 or higher is required. You have v$NODE_VERSION."
    echo "Please upgrade your Node.js installation."
    exit 1
fi

echo "Node.js v$NODE_VERSION detected. ✅"

# Create necessary directories
echo "Creating necessary directories..."
mkdir -p public/icons

# Install dependencies
echo "Installing dependencies..."
npm install

# Check if .env file exists
if [ ! -f .env ] && [ "$IS_REPLIT" = false ]; then
    echo "Creating .env file from template..."
    cp .env.example .env
    echo "⚠️  Please edit the .env file and add your API keys."
fi

# Create placeholder icons if not exists
if [ ! -f public/icons/sirius-icon-192.png ]; then
    echo "Creating placeholder icon files..."
    echo "PLACEHOLDER ICON" > public/icons/sirius-icon-192.png
    echo "PLACEHOLDER ICON" > public/icons/sirius-icon-512.png
fi

# Install global dependencies based on environment
if [ "$IS_REPLIT" = false ]; then
    # Check if nodemon is installed
    if ! command -v nodemon &> /dev/null; then
        echo "Installing nodemon globally..."
        npm install -g nodemon
    fi
fi

# Setup based on environment
if [ "$IS_REPLIT" = true ]; then
    echo "Setting up for Replit environment..."
    # Create start script for Replit
    echo "#!/bin/bash" > .replit
    echo "run=\"npm start\"" >> .replit
    chmod +x .replit
else
    echo "Setting up for local environment..."
    # Make sure run script is executable
    chmod +x run.sh
fi

# Try to build service worker (may fail but that's ok)
echo "Building service worker..."
npm run build:sw || echo "Service worker build failed. This is not critical."

echo "========================================================="
echo "  Setup Complete! 🚀"
if [ "$IS_REPLIT" = true ]; then
    echo "  Run using the Run button in Replit"
else 
    echo "  Run './run.sh' to start the development server"
    echo "  Run 'npm run local' for a simple startup"
    echo "  Run 'npm start' for production mode"
fi
echo "=========================================================" 
#!/bin/bash

# S.I.R.I.U.S. Run Script
# This script runs the S.I.R.I.U.S. application in development mode

echo "========================================================="
echo "  S.I.R.I.U.S. Development Server"
echo "  SMART, INTELLIGENT, RESPONSIVE, INTEGRATIVE, USER-FRIENDLY, SYSTEM"
echo "========================================================="

# Set environment variables
export NODE_ENV=development
export PORT=3000

# Run the application
echo "Starting server on port ${PORT}..."
echo "Press Ctrl+C to stop"
echo ""

node index.js 
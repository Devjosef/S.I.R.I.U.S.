#!/bin/bash

# n8n Setup Script for S.I.R.I.U.S.
echo "🚀 Setting up n8n for S.I.R.I.U.S. integration..."

# Kill any existing n8n processes
echo "🔄 Stopping existing n8n processes..."
pkill -f n8n 2>/dev/null
sleep 2

# Set environment variables
export N8N_RUNNERS_ENABLED=true
export N8N_TIMEOUT=60000
export N8N_PORT=5678
export N8N_HOST=localhost

# Start n8n
echo "🚀 Starting n8n..."
n8n start &

# Wait for n8n to start
echo "⏳ Waiting for n8n to start..."
sleep 15

# Check if n8n is running
if curl -s http://localhost:5678/health > /dev/null; then
    echo "✅ n8n is running successfully!"
    echo "Open http://localhost:5678 in your browser"
    echo ""
    echo "Next steps:"
    echo "1. Create your admin account"
    echo "2. Go to Settings → API Keys"
    echo "3. Create an API key for S.I.R.I.U.S."
    echo "4. Add the API key to your environment variables"
    echo ""
    echo "🔧 To add API key to S.I.R.I.U.S., run:"
    echo "export N8N_API_KEY='your-api-key-here'"
    echo "export N8N_BASE_URL='http://localhost:5678'"
    echo ""
    echo "🧪 Test the integration:"
    echo "curl -s 'http://localhost:3000/api/n8n/test'"
else
    echo "❌ Failed to start n8n"
    exit 1
fi 
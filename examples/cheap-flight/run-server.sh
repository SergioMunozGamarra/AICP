#!/bin/bash

# AICP Mock Server Setup and Run Script

set -e

echo "╔════════════════════════════════════════════════╗"
echo "║  Setting up AICP Mock Server (Cheap Flight)   ║"
echo "╚════════════════════════════════════════════════╝"

cd "$(dirname "$0")/server"

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is required but not installed."
    echo "   Install from https://nodejs.org/"
    exit 1
fi

echo "✓ Node.js $(node --version) found"

# Install dependencies
if [ ! -d "node_modules" ]; then
    echo ""
    echo "📦 Installing dependencies..."
    npm install --silent
    echo "✓ Dependencies installed"
fi

echo ""
echo "🚀 Starting AICP Mock Server..."
echo ""

npm start

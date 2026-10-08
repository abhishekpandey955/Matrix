#!/bin/bash
# ============================================================
# MediCare — Local Development Setup Script
# Run this once in any new terminal before using bun/node:
#   source setup-env.sh
# ============================================================

# Load nvm
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"

# Use Node 22
nvm use 22 2>/dev/null || echo "Node 22 not found — run: nvm install 22"

# Load bun
export BUN_INSTALL="$HOME/.bun"
export PATH="$BUN_INSTALL/bin:$PATH"

echo ""
echo "✅ Environment ready:"
echo "   Node: $(node --version 2>/dev/null || echo 'NOT FOUND')"
echo "   Bun:  $(bun --version 2>/dev/null || echo 'NOT FOUND')"
echo ""
echo "👉 To start the frontend dev server:"
echo "   cd Frontend && bun run dev"
echo ""

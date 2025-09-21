#!/usr/bin/env bash
set -euo pipefail

echo "🔧 Setting up o3-search-mcp server..."

# Check if OPENAI_API_KEY is set
if [[ -z "${OPENAI_API_KEY:-}" ]]; then
    echo "❌ OPENAI_API_KEY environment variable is not set"
    echo "Please set your OpenAI API key in your host environment:"
    echo "  export OPENAI_API_KEY='your-api-key-here'"
    echo ""
    echo "Or create a .env.local file based on .env.example"
    exit 1
fi

# Set default model if not specified
OPENAI_MODEL="${OPENAI_MODEL:-o3-mini}"

echo "📋 Configuration:"
echo "  Model: ${OPENAI_MODEL}"
echo "  API Key: ${OPENAI_API_KEY:0:8}..." # Show only first 8 chars

# Add MCP server to Claude Code
echo "🚀 Adding o3-search-mcp to Claude Code..."
claude mcp add o3-search \
    --env OPENAI_API_KEY="${OPENAI_API_KEY}" \
    --env OPENAI_MODEL="${OPENAI_MODEL}" \
    --scope project \
    -- npx o3-search-mcp

echo "✅ o3-search-mcp has been configured successfully!"
echo ""
echo "📖 Usage:"
echo "  The MCP server provides enhanced search capabilities powered by OpenAI o3."
echo "  You can now use advanced search functions in your Claude Code sessions."
echo ""
echo "🔍 To verify the setup:"
echo "  claude mcp list"
#!/bin/bash

# Azure OpenAI Integration Test Script
# This script helps validate your Azure OpenAI configuration

echo "🔧 Testing Azure OpenAI Integration for Fireplexity"
echo "=================================================="

# Check if .env.local exists
if [ ! -f ".env.local" ]; then
    echo "❌ .env.local file not found!"
    echo "   Please copy .env.example to .env.local and configure your Azure OpenAI settings."
    exit 1
fi

echo "✅ Found .env.local file"

# Source the environment file
set -a
source .env.local
set +a

# Check required Azure OpenAI variables
echo ""
echo "🔍 Checking Azure OpenAI Configuration..."

if [ -z "$AZURE_OPENAI_ENDPOINT" ]; then
    echo "❌ AZURE_OPENAI_ENDPOINT is not set"
    MISSING_VARS=true
fi

if [ -z "$AZURE_OPENAI_API_KEY" ]; then
    echo "❌ AZURE_OPENAI_API_KEY is not set"
    MISSING_VARS=true
fi

if [ -z "$AZURE_OPENAI_DEPLOYMENT_NAME" ]; then
    echo "❌ AZURE_OPENAI_DEPLOYMENT_NAME is not set"
    MISSING_VARS=true
fi

if [ -z "$FIRECRAWL_API_KEY" ]; then
    echo "❌ FIRECRAWL_API_KEY is not set"
    MISSING_VARS=true
fi

if [ "$MISSING_VARS" = true ]; then
    echo ""
    echo "❌ Missing required environment variables!"
    echo "   Please configure all required variables in .env.local"
    echo ""
    echo "📚 See AZURE_SETUP.md for detailed setup instructions"
    exit 1
fi

echo "✅ All required Azure OpenAI variables are set"

# Check optional APIM variables
if [ -n "$AZURE_APIM_ENDPOINT" ] && [ -n "$AZURE_APIM_SUBSCRIPTION_KEY" ]; then
    echo "✅ Azure APIM configuration detected"
    APIM_MODE=true
else
    echo "ℹ️  Using direct Azure OpenAI connection (no APIM)"
    APIM_MODE=false
fi

echo ""
echo "📋 Configuration Summary:"
echo "   Azure OpenAI Endpoint: ${AZURE_OPENAI_ENDPOINT}"
echo "   Deployment Name: ${AZURE_OPENAI_DEPLOYMENT_NAME}"
echo "   API Version: ${AZURE_OPENAI_API_VERSION:-2024-02-15-preview}"
if [ "$APIM_MODE" = true ]; then
    echo "   APIM Endpoint: ${AZURE_APIM_ENDPOINT}"
    echo "   Mode: Azure APIM Gateway"
else
    echo "   Mode: Direct Azure OpenAI"
fi

echo ""
echo "🚀 Starting development server to test configuration..."
echo "   Visit http://localhost:3000 to test the application"
echo "   Check http://localhost:3000/api/fireplexity/check-env for configuration validation"
echo ""
echo "Press Ctrl+C to stop the server"

# Start the development server
npm run dev

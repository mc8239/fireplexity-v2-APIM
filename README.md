# Fireplexity v2

AI search engine with web, news, and images. Now supports Azure API Management (APIM) with OpenAI Chat Completion endpoints.

<img src="https://media0.giphy.com/media/v1.Y2lkPTc5MGI3NjExNjBxbWFxamZycWRkMmVhMGFiZnNuZjMxc3lpNHpuamR4OWlwa3F4NSZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/QbfaTCB1OmkRmIQwzJ/giphy.gif" width="100%" alt="Fireplexity Demo" />

## Features

- 🔍 **Smart Web Search** - Powered by Firecrawl v2
- 📰 **News Integration** - Real-time news results
- 🖼️ **Image Search** - Visual content discovery
- 🤖 **AI Chat** - Powered by Azure OpenAI through APIM
- 📊 **Stock Charts** - Company information and trading data
- 🎯 **Follow-up Questions** - Contextual suggestions

## Setup

```bash
git clone https://github.com/mendableai/fireplexity.git
cd fireplexity
npm install
```

## Configure

### Option 1: Direct Azure OpenAI (Recommended)

```bash
cp .env.example .env.local
```

Add your keys to `.env.local`:
```
# Firecrawl API Key
FIRECRAWL_API_KEY=fc-your-api-key

# Azure OpenAI Configuration
AZURE_OPENAI_ENDPOINT=https://your-resource.openai.azure.com/
AZURE_OPENAI_API_KEY=your-azure-openai-api-key
AZURE_OPENAI_API_VERSION=2024-02-15-preview
AZURE_OPENAI_DEPLOYMENT_NAME=gpt-4o
```

### Option 2: Azure APIM Gateway (Advanced)

For advanced scenarios with API Management:

```
# Additional APIM Configuration
AZURE_APIM_ENDPOINT=https://your-apim-gateway.azure-api.net/
AZURE_APIM_SUBSCRIPTION_KEY=your-apim-subscription-key
```

**📖 For detailed Azure APIM setup instructions, see [AZURE_SETUP.md](./AZURE_SETUP.md)**

### Legacy Groq Configuration (Deprecated)

The app previously used Groq but now defaults to Azure OpenAI. Groq support has been removed.

## Run

```bash
npm run dev
```

Open http://localhost:3000

## Validation

Check your configuration at:
- `/api/fireplexity/check-env` - General environment validation
- `/api/fireplexity/check-azure-env` - Azure OpenAI specific validation

## Deploy

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/mendableai/fireplexity)

Make sure to add your environment variables in the Vercel dashboard.

## Get API Keys

- [Firecrawl](https://firecrawl.dev) - For web search and crawling
- [Azure OpenAI](https://azure.microsoft.com/en-us/products/ai-services/openai-service) - For AI chat completions

## Architecture

- **Frontend**: Next.js 15 with React 19
- **AI**: Azure OpenAI through APIM or direct connection
- **Search**: Firecrawl v2 API
- **Styling**: Tailwind CSS + Radix UI
- **Deployment**: Vercel (recommended)

MIT License
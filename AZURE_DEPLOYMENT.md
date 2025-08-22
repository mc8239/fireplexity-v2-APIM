# Azure Deployment Guide for Fireplexity

This guide covers deploying Fireplexity to Azure with proper APIM integration.

## Deployment Options

### Option 1: Azure Static Web Apps (Recommended)

Azure Static Web Apps is perfect for Next.js applications with API routes.

#### Prerequisites
- Azure CLI installed and logged in
- GitHub repository with your Fireplexity code

#### Steps

1. **Create Azure Static Web App**
   ```bash
   az staticwebapp create \
     --name "fireplexity-app" \
     --resource-group "your-rg" \
     --source "https://github.com/your-username/fireplexity" \
     --location "East US 2" \
     --branch "main" \
     --app-location "/" \
     --api-location "app/api" \
     --output-location ".next"
   ```

2. **Configure Environment Variables**
   ```bash
   # Add Azure OpenAI configuration
   az staticwebapp appsettings set \
     --name "fireplexity-app" \
     --setting-names "AZURE_OPENAI_ENDPOINT=https://your-resource.openai.azure.com/" \
                     "AZURE_OPENAI_API_KEY=your-api-key" \
                     "AZURE_OPENAI_DEPLOYMENT_NAME=gpt-4o" \
                     "FIRECRAWL_API_KEY=fc-your-key"
   
   # Optional: Add APIM configuration
   az staticwebapp appsettings set \
     --name "fireplexity-app" \
     --setting-names "AZURE_APIM_ENDPOINT=https://your-apim.azure-api.net/" \
                     "AZURE_APIM_SUBSCRIPTION_KEY=your-apim-key"
   ```

### Option 2: Azure Container Apps

For containerized deployment with more control.

#### Dockerfile
```dockerfile
FROM node:18-alpine AS base

# Install dependencies only when needed
FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

COPY package.json pnpm-lock.yaml* ./
RUN npm install -g pnpm && pnpm install --frozen-lockfile

# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

RUN npm install -g pnpm && pnpm run build

# Production image, copy all the files and run next
FROM base AS runner
WORKDIR /app

ENV NODE_ENV production

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public

# Automatically leverage output traces to reduce image size
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

ENV PORT 3000

CMD ["node", "server.js"]
```

#### Deploy to Container Apps
```bash
# Create Container App Environment
az containerapp env create \
  --name "fireplexity-env" \
  --resource-group "your-rg" \
  --location "East US 2"

# Deploy Container App
az containerapp create \
  --name "fireplexity-app" \
  --resource-group "your-rg" \
  --environment "fireplexity-env" \
  --image "your-registry.azurecr.io/fireplexity:latest" \
  --target-port 3000 \
  --ingress 'external' \
  --env-vars "AZURE_OPENAI_ENDPOINT=https://your-resource.openai.azure.com/" \
             "AZURE_OPENAI_API_KEY=your-api-key" \
             "AZURE_OPENAI_DEPLOYMENT_NAME=gpt-4o" \
             "FIRECRAWL_API_KEY=fc-your-key"
```

## Azure Resources Setup

### Infrastructure as Code (Bicep)

Create `infra/main.bicep`:

```bicep
@description('Location for all resources.')
param location string = resourceGroup().location

@description('Name of the Azure OpenAI resource.')
param openAiName string = 'fireplexity-openai-${uniqueString(resourceGroup().id)}'

@description('Name of the API Management service.')
param apimName string = 'fireplexity-apim-${uniqueString(resourceGroup().id)}'

@description('Name of the Static Web App.')
param staticWebAppName string = 'fireplexity-swa-${uniqueString(resourceGroup().id)}'

// Azure OpenAI Service
resource openAi 'Microsoft.CognitiveServices/accounts@2023-05-01' = {
  name: openAiName
  location: location
  kind: 'OpenAI'
  sku: {
    name: 'S0'
  }
  properties: {
    customSubDomainName: openAiName
    publicNetworkAccess: 'Enabled'
  }
}

// GPT-4o Deployment
resource gpt4Deployment 'Microsoft.CognitiveServices/accounts/deployments@2023-05-01' = {
  parent: openAi
  name: 'gpt-4o'
  sku: {
    name: 'Standard'
    capacity: 10
  }
  properties: {
    model: {
      format: 'OpenAI'
      name: 'gpt-4o'
      version: '2024-05-13'
    }
  }
}

// API Management Service (Optional)
resource apim 'Microsoft.ApiManagement/service@2023-05-01-preview' = {
  name: apimName
  location: location
  sku: {
    name: 'Developer'
    capacity: 1
  }
  properties: {
    publisherEmail: 'admin@yourcompany.com'
    publisherName: 'Your Company'
  }
}

// Static Web App
resource staticWebApp 'Microsoft.Web/staticSites@2023-01-01' = {
  name: staticWebAppName
  location: location
  sku: {
    name: 'Standard'
    tier: 'Standard'
  }
  properties: {
    repositoryUrl: 'https://github.com/your-username/fireplexity'
    branch: 'main'
    buildProperties: {
      appLocation: '/'
      apiLocation: 'app/api'
      outputLocation: '.next'
    }
  }
}

// Outputs
output openAiEndpoint string = openAi.properties.endpoint
output openAiApiKey string = openAi.listKeys().key1
output apimGatewayUrl string = apim.properties.gatewayUrl
output staticWebAppUrl string = staticWebApp.properties.defaultHostname
```

Deploy with:
```bash
az deployment group create \
  --resource-group "your-rg" \
  --template-file "infra/main.bicep"
```

## Security Configuration

### Managed Identity (Recommended)

For production deployments, use Managed Identity instead of API keys:

1. **Enable Managed Identity on your app**
2. **Grant access to Azure OpenAI**
   ```bash
   az role assignment create \
     --assignee "your-app-managed-identity-id" \
     --role "Cognitive Services OpenAI User" \
     --scope "/subscriptions/your-sub/resourceGroups/your-rg/providers/Microsoft.CognitiveServices/accounts/your-openai"
   ```

3. **Update application code** to use DefaultAzureCredential

### Network Security

1. **Configure Virtual Networks**
2. **Enable Private Endpoints for Azure OpenAI**
3. **Set up APIM with IP restrictions**

## Monitoring and Logging

### Application Insights

Add Application Insights to monitor your application:

```bash
az monitor app-insights component create \
  --app "fireplexity-insights" \
  --location "East US 2" \
  --resource-group "your-rg"
```

### Azure Monitor

Set up alerts for:
- Azure OpenAI quota limits
- High error rates
- Performance degradation
- Cost thresholds

## Cost Optimization

1. **Choose appropriate SKUs**
   - Development: Use Developer tier for APIM
   - Production: Use Standard/Premium based on requirements

2. **Monitor Azure OpenAI usage**
   - Set up cost alerts
   - Monitor token usage
   - Consider reserved capacity for predictable workloads

3. **Optimize Static Web App**
   - Use Free tier for development
   - Standard tier for production with custom domains

## Troubleshooting

### Common Deployment Issues

1. **Static Web App Build Failures**
   - Check Node.js version compatibility
   - Verify environment variables are set
   - Review build logs in Azure portal

2. **Azure OpenAI Access Issues**
   - Verify resource is in correct region
   - Check API key permissions
   - Ensure model is deployed and running

3. **APIM Configuration Problems**
   - Verify backend service configuration
   - Check APIM policies
   - Review subscription key settings

### Debug Commands

```bash
# Check Azure OpenAI status
az cognitiveservices account show \
  --name "your-openai-resource" \
  --resource-group "your-rg"

# List deployments
az cognitiveservices account deployment list \
  --name "your-openai-resource" \
  --resource-group "your-rg"

# Check Static Web App logs
az staticwebapp logs show \
  --name "your-static-web-app" \
  --resource-group "your-rg"
```

## Best Practices

1. **Environment Separation**
   - Use different Azure OpenAI resources for dev/staging/prod
   - Separate APIM instances per environment

2. **CI/CD Pipeline**
   - Use GitHub Actions for automated deployments
   - Include automated testing
   - Environment-specific configurations

3. **Security**
   - Regular key rotation
   - Use Azure Key Vault for secrets
   - Enable audit logging
   - Implement rate limiting

4. **Performance**
   - Use Azure CDN for static assets
   - Configure appropriate caching headers
   - Monitor and optimize API response times

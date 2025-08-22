# Azure APIM + OpenAI Integration Setup

This document provides comprehensive instructions for integrating Fireplexity with Azure API Management (APIM) and OpenAI Chat Completion endpoints.

## Overview

Fireplexity now supports two Azure OpenAI integration scenarios:

1. **Direct Azure OpenAI**: Connect directly to Azure OpenAI services
2. **Azure APIM Gateway**: Route requests through Azure API Management for additional control, monitoring, and security

## Prerequisites

- Azure subscription with Azure OpenAI service enabled
- Azure OpenAI resource with a deployed model (e.g., GPT-4o, GPT-3.5-turbo)
- (Optional) Azure API Management instance for gateway scenario

## Configuration

### Environment Variables

Copy `.env.example` to `.env.local` and configure the following variables:

#### Required for Direct Azure OpenAI
```bash
# Azure OpenAI Configuration
AZURE_OPENAI_ENDPOINT=https://your-resource.openai.azure.com/
AZURE_OPENAI_API_KEY=your-azure-openai-api-key
AZURE_OPENAI_API_VERSION=2024-02-15-preview
AZURE_OPENAI_DEPLOYMENT_NAME=gpt-4o
```

#### Additional for APIM Gateway Scenario
```bash
# Azure APIM Configuration (optional)
AZURE_APIM_ENDPOINT=https://your-apim-gateway.azure-api.net/
AZURE_APIM_SUBSCRIPTION_KEY=your-apim-subscription-key
```

### Configuration Details

#### Azure OpenAI Endpoint
- Format: `https://YOUR_RESOURCE_NAME.openai.azure.com/`
- Find this in the Azure portal under your Azure OpenAI resource → "Keys and Endpoint"

#### Azure OpenAI API Key
- Get from Azure portal under your Azure OpenAI resource → "Keys and Endpoint"
- Use either Key 1 or Key 2

#### API Version
- Recommended: `2024-02-15-preview` (supports latest features)
- Other options: `2023-12-01-preview`, `2023-06-01-preview`

#### Deployment Name
- The name you gave your model deployment in Azure OpenAI Studio
- Common examples: `gpt-4o`, `gpt-35-turbo`, `gpt-4`

#### APIM Configuration (Optional)
- **APIM Endpoint**: Your API Management gateway URL
- **Subscription Key**: Primary or secondary subscription key from APIM

## Setup Instructions

### Option 1: Direct Azure OpenAI (Simplest)

1. **Create Azure OpenAI Resource**
   ```bash
   # Using Azure CLI
   az cognitiveservices account create \
     --name "your-openai-resource" \
     --resource-group "your-rg" \
     --location "eastus" \
     --kind "OpenAI" \
     --sku "S0"
   ```

2. **Deploy a Model**
   - Go to Azure OpenAI Studio
   - Navigate to "Deployments"
   - Create a new deployment with GPT-4o or your preferred model
   - Note the deployment name for configuration

3. **Configure Environment Variables**
   - Set `AZURE_OPENAI_*` variables as shown above
   - Leave `AZURE_APIM_*` variables empty

### Option 2: Azure APIM Gateway (Advanced)

1. **Complete Option 1 first**

2. **Create Azure API Management Instance**
   ```bash
   # Using Azure CLI
   az apim create \
     --name "your-apim-instance" \
     --resource-group "your-rg" \
     --location "eastus" \
     --publisher-email "admin@yourcompany.com" \
     --publisher-name "Your Company"
   ```

3. **Configure APIM for OpenAI**
   - Import the OpenAI API specification
   - Set up backend service pointing to your Azure OpenAI endpoint
   - Configure authentication policies
   - Set up subscription keys

4. **Configure Environment Variables**
   - Set all `AZURE_OPENAI_*` variables
   - Set `AZURE_APIM_ENDPOINT` to your APIM gateway URL
   - Set `AZURE_APIM_SUBSCRIPTION_KEY` to your APIM subscription key

## Validation

### Check Configuration
Visit `/api/fireplexity/check-env` to validate your configuration:

```json
{
  "hasFirecrawlKey": true,
  "hasAzureOpenAI": true,
  "azureOpenAIErrors": []
}
```

### Test Azure OpenAI Specific Endpoint
Visit `/api/fireplexity/check-azure-env` for detailed Azure OpenAI validation.

## Benefits of Each Approach

### Direct Azure OpenAI
- ✅ Simple setup
- ✅ Lower latency
- ✅ Direct cost tracking
- ❌ Limited monitoring/analytics
- ❌ No rate limiting beyond Azure OpenAI

### APIM Gateway
- ✅ Advanced monitoring and analytics
- ✅ Custom rate limiting and quotas
- ✅ Request/response transformation
- ✅ Multiple backend support
- ✅ Developer portal
- ❌ Additional complexity
- ❌ Extra cost for APIM service
- ❌ Slight latency increase

## Security Best Practices

1. **Use Managed Identity** (recommended for production)
   - Configure Azure OpenAI and APIM with managed identity
   - Avoid storing API keys in environment variables

2. **Key Rotation**
   - Regularly rotate Azure OpenAI API keys
   - Use Azure Key Vault for secret management

3. **Network Security**
   - Configure virtual networks for Azure OpenAI
   - Use private endpoints where possible
   - Configure APIM with IP restrictions

4. **Monitoring**
   - Enable Azure Monitor for both services
   - Set up alerts for quota limits and errors
   - Monitor cost and usage patterns

## Troubleshooting

### Common Issues

1. **"Azure OpenAI configuration missing" Error**
   - Verify all required environment variables are set
   - Check endpoint format includes protocol (https://)

2. **Authentication Failures**
   - Verify API key is correct and active
   - Check if resource is in the correct region
   - Ensure model is deployed and accessible

3. **APIM Issues**
   - Verify subscription key is active
   - Check APIM policies don't block requests
   - Ensure backend service is configured correctly

4. **Model Not Found**
   - Verify deployment name matches exactly
   - Check if model deployment is running
   - Ensure you have access to the deployed model

### Debug Mode

Set environment variable for detailed logging:
```bash
DEBUG=azure-openai
```

## Migration from Groq

The application automatically handles the migration from Groq to Azure OpenAI. Key changes:

- Groq's `moonshotai/kimi-k2-instruct` → Azure OpenAI model (configurable)
- Authentication via API keys → Azure OpenAI authentication
- All existing functionality preserved

## Support

For issues with:
- **Azure OpenAI**: Check Azure documentation and support
- **APIM**: Review APIM documentation and policies
- **Application**: Check application logs and configuration validation endpoints

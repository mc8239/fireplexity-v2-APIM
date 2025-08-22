import { createAzure } from '@ai-sdk/azure'
import { createOpenAI } from '@ai-sdk/openai'

/**
 * Configuration for Azure OpenAI integration
 * Supports both direct Azure OpenAI and APIM gateway scenarios
 */
export interface AzureOpenAIConfig {
  endpoint: string
  apiKey: string
  apiVersion: string
  deploymentName: string
  // APIM specific configuration
  apimEndpoint?: string
  apimSubscriptionKey?: string
}

/**
 * Get Azure OpenAI configuration from environment variables
 */
export function getAzureOpenAIConfig(): AzureOpenAIConfig {
  const endpoint = process.env.AZURE_OPENAI_ENDPOINT
  const apiKey = process.env.AZURE_OPENAI_API_KEY
  const apiVersion = process.env.AZURE_OPENAI_API_VERSION || '2024-02-15-preview'
  const deploymentName = process.env.AZURE_OPENAI_DEPLOYMENT_NAME || 'gpt-4o'
  
  // APIM configuration (optional)
  const apimEndpoint = process.env.AZURE_APIM_ENDPOINT
  const apimSubscriptionKey = process.env.AZURE_APIM_SUBSCRIPTION_KEY

  if (!endpoint || !apiKey) {
    throw new Error('Azure OpenAI configuration missing. Please set AZURE_OPENAI_ENDPOINT and AZURE_OPENAI_API_KEY environment variables.')
  }

  return {
    endpoint,
    apiKey,
    apiVersion,
    deploymentName,
    apimEndpoint,
    apimSubscriptionKey
  }
}

/**
 * Create Azure OpenAI client with proper configuration
 * Supports both direct Azure OpenAI and APIM gateway scenarios
 */
export function createAzureOpenAIClient() {
  const config = getAzureOpenAIConfig()
  
  // If APIM endpoint is configured, use it as a proxy
  if (config.apimEndpoint && config.apimSubscriptionKey) {
    // CRITICAL FIX: Use createAzure with useDeploymentBasedUrls: true
    // This forces the legacy deployment format: /openai/deployments/{deployment}/chat/completions
    // instead of the new v1 format: /openai/v1/responses
    
    console.log('🔧 APIM Configuration:')
    console.log('  APIM Endpoint:', config.apimEndpoint)
    console.log('  Deployment Name:', config.deploymentName)
    console.log('  Expected final URL:', `${config.apimEndpoint}/openai/deployments/${config.deploymentName}/chat/completions`)
    
    return createAzure({
      baseURL: config.apimEndpoint.replace(/\/$/, ''),
      apiKey: config.apiKey,
      apiVersion: config.apiVersion,
      useDeploymentBasedUrls: true, // CRITICAL: Forces legacy deployment-based URLs
      headers: {
        'Ocp-Apim-Subscription-Key': config.apimSubscriptionKey
      }
    })
  } else {
    // Direct Azure OpenAI connection - use the native Azure provider
    return createAzure({
      resourceName: extractResourceName(config.endpoint),
      apiKey: config.apiKey,
      apiVersion: config.apiVersion
    })
  }
}

/**
 * Extract resource name from Azure OpenAI endpoint
 */
function extractResourceName(endpoint: string): string {
  const match = endpoint.match(/https:\/\/([^.]+)\.openai\.azure\.com/)
  if (!match) {
    throw new Error('Invalid Azure OpenAI endpoint format. Expected: https://your-resource.openai.azure.com/')
  }
  return match[1]
}

/**
 * Get the model identifier for the AI SDK
 */
export function getAzureOpenAIModel(): string {
  const config = getAzureOpenAIConfig()
  
  // For APIM with deployment-based URLs, use the deployment name
  // The createAzure with useDeploymentBasedUrls will handle the URL construction
  return config.deploymentName
}

/**
 * Validate Azure OpenAI configuration
 */
export function validateAzureOpenAIConfig(): { isValid: boolean; errors: string[] } {
  const errors: string[] = []
  
  try {
    const config = getAzureOpenAIConfig()
    
    if (!config.endpoint.includes('openai.azure.com') && !config.apimEndpoint) {
      errors.push('Either AZURE_OPENAI_ENDPOINT must be a valid Azure OpenAI endpoint or AZURE_APIM_ENDPOINT must be configured')
    }
    
    if (config.apimEndpoint && !config.apimSubscriptionKey) {
      errors.push('AZURE_APIM_SUBSCRIPTION_KEY is required when using APIM endpoint')
    }
    
    if (!config.deploymentName) {
      errors.push('AZURE_OPENAI_DEPLOYMENT_NAME is required')
    }
    
  } catch (error) {
    errors.push(error instanceof Error ? error.message : 'Unknown configuration error')
  }
  
  return {
    isValid: errors.length === 0,
    errors
  }
}

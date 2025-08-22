import { createAzure } from '@ai-sdk/azure'
import { createOpenAI } from '@ai-sdk/openai'

/**
 * Configuration for Azure OpenAI integration
 * Supports both direct Azure OpenAI and Azure APIM scenarios
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
    // For APIM, use createOpenAI with custom configuration to match Azure OpenAI format
    // We need to set up the baseURL to not include the deployment path
    // and let the AI SDK construct the proper Azure-style paths
    return createOpenAI({
      baseURL: `${config.apimEndpoint.replace(/\/$/, '')}/openai`,
      apiKey: config.apiKey,
      headers: {
        'Ocp-Apim-Subscription-Key': config.apimSubscriptionKey,
        'api-version': config.apiVersion,
        'api-key': config.apiKey
      }
    })
  } else {
    // Direct Azure OpenAI connection
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
  
  // For APIM scenarios, the model should be formatted for Azure OpenAI
  if (config.apimEndpoint) {
    return `deployments/${config.deploymentName}`
  }
  
  // For direct Azure OpenAI, use the deployment name
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

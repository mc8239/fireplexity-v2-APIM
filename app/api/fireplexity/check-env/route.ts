import { NextResponse } from 'next/server'
import { validateAzureOpenAIConfig } from '@/lib/azure-openai-config'

export async function GET() {
  const azureValidation = validateAzureOpenAIConfig()
  
  return NextResponse.json({
    hasFirecrawlKey: !!process.env.FIRECRAWL_API_KEY,
    hasAzureOpenAI: azureValidation.isValid,
    azureOpenAIErrors: azureValidation.errors
  })
}
import { NextResponse } from 'next/server'
import { validateAzureOpenAIConfig } from '@/lib/azure-openai-config'

export async function GET() {
  try {
    const validation = validateAzureOpenAIConfig()
    
    if (!validation.isValid) {
      return NextResponse.json(
        { 
          error: 'Azure OpenAI configuration is invalid',
          details: validation.errors,
          configured: false
        },
        { status: 500 }
      )
    }

    return NextResponse.json({
      message: 'Azure OpenAI configuration is valid',
      configured: true
    })
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json(
      { 
        error: 'Failed to validate Azure OpenAI configuration',
        details: [errorMessage],
        configured: false
      },
      { status: 500 }
    )
  }
}

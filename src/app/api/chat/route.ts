import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'
import { PrismaClient } from '@prisma/client'
import crypto from 'crypto-js'

// Use fallback tokenization approach without tiktoken

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

const prisma = new PrismaClient()

export async function POST(request: NextRequest) {
  try {
    const { prompt, model } = await request.json()
    
    if (!prompt || !model) {
      return NextResponse.json(
        { error: 'Missing prompt or model' },
        { status: 400 }
      )
    }

    const startTime = Date.now()
    const promptHash = crypto.SHA256(prompt).toString()

    try {
      const response = await openai.chat.completions.create({
        model: model,
        messages: [{ role: 'user', content: prompt }],
      })

      const endTime = Date.now()
      const latencyMs = endTime - startTime

      const tokensIn = response.usage?.prompt_tokens || 0
      const tokensOut = response.usage?.completion_tokens || 0
      const content = response.choices[0]?.message?.content || ''

      // Get token breakdown for visualization using fallback approach
      // Create token arrays based on OpenAI's token counts
      const promptTokens = Array.from({length: tokensIn}, (_, i) => i)
      const responseTokens = Array.from({length: tokensOut}, (_, i) => i + tokensIn)

      const tokenBreakdownData = {
        prompt: promptTokens,
        response: responseTokens,
        promptText: prompt,
        responseText: content,
      }

      await prisma.metric.create({
        data: {
          model,
          promptHash,
          promptChars: prompt.length,
          tokensIn,
          tokensOut,
          latencyMs,
          status: 'ok',
          promptText: prompt,
          responseText: content,
          tokenBreakdown: JSON.stringify(tokenBreakdownData),
        },
      })

      return NextResponse.json({
        response: content,
        tokensIn,
        tokensOut,
        latencyMs,
        tokenBreakdown: {
          prompt: promptTokens,
          response: responseTokens,
          promptText: prompt,
          responseText: content,
        },
      })
    } catch (openaiError: any) {
      const endTime = Date.now()
      const latencyMs = endTime - startTime

      await prisma.metric.create({
        data: {
          model,
          promptHash,
          promptChars: prompt.length,
          tokensIn: 0,
          tokensOut: 0,
          latencyMs,
          status: 'error',
          error: openaiError.message,
        },
      })

      return NextResponse.json(
        { error: openaiError.message },
        { status: 500 }
      )
    }
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
}
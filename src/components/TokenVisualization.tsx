'use client'

import { useState } from 'react'
import Tooltip from './Tooltip'

// Use text-based tokenization fallback only to avoid WASM issues

interface TokenBreakdown {
  prompt: number[]
  response: number[]
  promptText: string
  responseText: string
}

interface TokenVisualizationProps {
  tokenBreakdown: TokenBreakdown | null
  model: string
}

export default function TokenVisualization({ tokenBreakdown, model }: TokenVisualizationProps) {
  const [isExpanded, setIsExpanded] = useState(false)

  if (!tokenBreakdown) {
    return null
  }

  // Simple token ID display - no tiktoken needed
  const decodeToken = (tokenId: number): string => {
    return `Token ${tokenId}`
  }

  // Create actual token text breakdown from the original text
  const createTokenTextBreakdown = (text: string, tokenCount: number) => {
    if (tokenCount === 0) return []
    if (!text) return Array(tokenCount).fill('').map((_, i) => `Token ${i}`)
    
    // Split text into words and punctuation
    const segments = text.match(/\S+|\s+/g) || []
    const tokens = []
    
    if (tokenCount <= segments.length) {
      // More segments than tokens - group segments together
      const segmentsPerToken = Math.max(1, Math.floor(segments.length / tokenCount))
      let segmentIndex = 0
      
      for (let i = 0; i < tokenCount; i++) {
        const remainingTokens = tokenCount - i
        const remainingSegments = segments.length - segmentIndex
        const segmentsForThisToken = Math.max(1, Math.ceil(remainingSegments / remainingTokens))
        
        const tokenSegments = segments.slice(segmentIndex, segmentIndex + segmentsForThisToken)
        const tokenText = tokenSegments.join('').trim()
        tokens.push(tokenText || `Token ${i}`)
        segmentIndex += segmentsForThisToken
      }
    } else {
      // More tokens than segments - split text more granularly
      let charIndex = 0
      const charsPerToken = Math.ceil(text.length / tokenCount)
      
      for (let i = 0; i < tokenCount; i++) {
        const remainingTokens = tokenCount - i
        const remainingChars = text.length - charIndex
        const charsForThisToken = Math.max(1, Math.ceil(remainingChars / remainingTokens))
        
        let tokenText = text.slice(charIndex, charIndex + charsForThisToken)
        
        // Try to break at word boundaries if possible
        if (i < tokenCount - 1 && charsForThisToken > 1) {
          const nextChar = text[charIndex + charsForThisToken]
          if (nextChar && nextChar !== ' ' && tokenText[tokenText.length - 1] !== ' ') {
            // Look for a better break point
            const spaceIndex = tokenText.lastIndexOf(' ')
            if (spaceIndex > 0) {
              tokenText = tokenText.slice(0, spaceIndex + 1)
            }
          }
        }
        
        tokens.push(tokenText.trim() || `Token ${i}`)
        charIndex += tokenText.length
        
        // Skip any extra whitespace
        while (charIndex < text.length && text[charIndex] === ' ') {
          charIndex++
        }
      }
    }
    
    return tokens
  }

  const promptTokenTexts = createTokenTextBreakdown(tokenBreakdown.promptText, tokenBreakdown.prompt.length)
  const responseTokenTexts = createTokenTextBreakdown(tokenBreakdown.responseText, tokenBreakdown.response.length)

  const getTokenColor = (index: number, isPrompt: boolean): string => {
    // Alternating white and light gray for visibility on black background
    return index % 2 === 0 ? '#ffffff' : '#cccccc'
  }

  return (
    <div className="mt-4 border border-white rounded-lg">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full px-4 py-3 text-left bg-black border border-white hover:bg-gray-900 rounded-t-lg flex justify-between items-center"
      >
        <span className="font-medium text-white">Token Breakdown</span>
        <span className="text-sm text-gray-400">
          {isExpanded ? '▼' : '▶'} {tokenBreakdown.prompt.length + tokenBreakdown.response.length} tokens
        </span>
      </button>
      
      {isExpanded && (
        <div className="p-4 space-y-4">
          {/* Prompt Tokens */}
          <div>
            <h4 className="font-medium text-sm text-white mb-2">
              Prompt Tokens ({tokenBreakdown.prompt.length})
            </h4>
            <div className="bg-black border border-white p-3 rounded">
              <div className="flex flex-wrap gap-1">
                {tokenBreakdown.prompt.map((tokenId, index) => {
                  // Use text-based breakdown
                  const displayText = promptTokenTexts[index] || `Token ${index}`;
                  const tooltipContent = `"${displayText}"`;
                  return (
                    <Tooltip key={`prompt-${index}`} content={tooltipContent}>
                      <span
                        className="inline-block px-2 py-1 text-xs border border-white rounded cursor-pointer"
                        style={{ 
                          backgroundColor: getTokenColor(index, true),
                          color: '#000000',
                          fontFamily: 'monospace'
                        }}
                      >
                        {displayText}
                      </span>
                    </Tooltip>
                  );
                })}
              </div>
              <div className="text-xs text-gray-400 mt-2">
                Original: "{tokenBreakdown.promptText}"
              </div>
            </div>
          </div>

          {/* Response Tokens */}
          <div>
            <h4 className="font-medium text-sm text-white mb-2">
              Response Tokens ({tokenBreakdown.response.length})
            </h4>
            <div className="bg-black border border-white p-3 rounded max-h-64 overflow-y-auto">
              <div className="flex flex-wrap gap-1">
                {tokenBreakdown.response.map((tokenId, index) => {
                  // Use text-based breakdown
                  const displayText = responseTokenTexts[index] || `Token ${index}`;
                  const tooltipContent = `"${displayText}"`;
                  return (
                    <Tooltip key={`response-${index}`} content={tooltipContent}>
                      <span
                        className="inline-block px-2 py-1 text-xs border border-white rounded cursor-pointer"
                        style={{ 
                          backgroundColor: getTokenColor(index, false),
                          color: '#000000',
                          fontFamily: 'monospace'
                        }}
                      >
                        {displayText}
                      </span>
                    </Tooltip>
                  );
                })}
              </div>
              <div className="text-xs text-gray-400 mt-2">
                Original: "{tokenBreakdown.responseText.substring(0, 100)}..."
              </div>
            </div>
          </div>

          {/* Summary */}
          <div className="bg-black border border-white p-3 rounded text-sm">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <span className="font-medium text-white">Prompt:</span> <span className="text-white">{tokenBreakdown.prompt.length} tokens</span>
              </div>
              <div>
                <span className="font-medium text-white">Response:</span> <span className="text-white">{tokenBreakdown.response.length} tokens</span>
              </div>
            </div>
            <div className="mt-2 text-gray-400 text-xs">
              Each colored box represents one token showing the actual text content. Hover over tokens to see details.
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
'use client'

import { useState } from 'react'

// Custom tooltip component
const Tooltip = ({ children, content }: { children: React.ReactNode, content: string }) => {
  const [showTooltip, setShowTooltip] = useState(false)
  
  return (
    <div 
      className="relative inline-block"
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
    >
      {children}
      {showTooltip && (
        <div className="absolute z-50 px-2 py-1 text-xs text-white bg-gray-900 rounded shadow-lg -top-8 left-1/2 transform -translate-x-1/2 whitespace-nowrap">
          {content}
          <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900"></div>
        </div>
      )}
    </div>
  )
}

// Dynamically import tiktoken to handle WASM issues
let tiktokenModule: any = null
try {
  tiktokenModule = require('tiktoken')
} catch (error) {
  console.warn('tiktoken not available in client:', error)
}

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

  const decodeToken = (tokenId: number): string => {
    try {
      if (tiktokenModule && tiktokenModule.encoding_for_model) {
        const encoding = tiktokenModule.encoding_for_model(model as any)
        const decoded = encoding.decode([tokenId])
        encoding.free()
        return decoded
      } else {
        return `Token ${tokenId}`
      }
    } catch (error) {
      return `Token ${tokenId}`
    }
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
    if (isPrompt) {
      return `hsl(${90 + (index * 20) % 80}, 70%, 85%)`
    } else {
      return `hsl(${120 + (index * 15) % 60}, 70%, 85%)`
    }
  }

  return (
    <div className="mt-4 border border-gray-200 rounded-lg">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full px-4 py-3 text-left bg-gray-50 hover:bg-gray-100 rounded-t-lg flex justify-between items-center"
      >
        <span className="font-medium">Token Breakdown</span>
        <span className="text-sm text-gray-500">
          {isExpanded ? '▼' : '▶'} {tokenBreakdown.prompt.length + tokenBreakdown.response.length} tokens
        </span>
      </button>
      
      {isExpanded && (
        <div className="p-4 space-y-4">
          {/* Prompt Tokens */}
          <div>
            <h4 className="font-medium text-sm text-gray-700 mb-2">
              Prompt Tokens ({tokenBreakdown.prompt.length})
            </h4>
            <div className="bg-blue-50 p-3 rounded border">
              <div className="flex flex-wrap gap-1">
                {tokenBreakdown.prompt.map((tokenId, index) => {
                  // Always prioritize our fallback text breakdown over tiktoken fallback
                  const tokenText = (tiktokenModule && tiktokenModule.encoding_for_model) 
                    ? decodeToken(tokenId) 
                    : (promptTokenTexts[index] || `Token ${index}`);
                  
                  // If tiktoken failed and returned a generic token, use our breakdown instead
                  const displayText = tokenText.startsWith('Token ') && promptTokenTexts[index] 
                    ? promptTokenTexts[index] 
                    : tokenText;
                    
                  const tooltipContent = `"${displayText}" | Token #${index + 1} (ID: ${tokenId})`;
                  return (
                    <Tooltip key={`prompt-${index}`} content={tooltipContent}>
                      <span
                        className="inline-block px-2 py-1 text-xs border border-blue-200 rounded cursor-pointer"
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
              <div className="text-xs text-gray-600 mt-2">
                Original: "{tokenBreakdown.promptText}"
              </div>
            </div>
          </div>

          {/* Response Tokens */}
          <div>
            <h4 className="font-medium text-sm text-gray-700 mb-2">
              Response Tokens ({tokenBreakdown.response.length})
            </h4>
            <div className="bg-green-50 p-3 rounded border max-h-64 overflow-y-auto">
              <div className="flex flex-wrap gap-1">
                {tokenBreakdown.response.map((tokenId, index) => {
                  // Always prioritize our fallback text breakdown over tiktoken fallback
                  const tokenText = (tiktokenModule && tiktokenModule.encoding_for_model) 
                    ? decodeToken(tokenId) 
                    : (responseTokenTexts[index] || `Token ${index}`);
                  
                  // If tiktoken failed and returned a generic token, use our breakdown instead
                  const displayText = tokenText.startsWith('Token ') && responseTokenTexts[index] 
                    ? responseTokenTexts[index] 
                    : tokenText;
                    
                  const tooltipContent = `"${displayText}" | Token #${index + 1} (ID: ${tokenId})`;
                  return (
                    <Tooltip key={`response-${index}`} content={tooltipContent}>
                      <span
                        className="inline-block px-2 py-1 text-xs border border-green-200 rounded cursor-pointer"
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
              <div className="text-xs text-gray-600 mt-2">
                Original: "{tokenBreakdown.responseText.substring(0, 100)}..."
              </div>
            </div>
          </div>

          {/* Summary */}
          <div className="bg-gray-50 p-3 rounded text-sm">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <span className="font-medium">Prompt:</span> {tokenBreakdown.prompt.length} tokens
              </div>
              <div>
                <span className="font-medium">Response:</span> {tokenBreakdown.response.length} tokens
              </div>
            </div>
            <div className="mt-2 text-gray-600 text-xs">
              Each colored box represents one token showing the actual text content. Hover over tokens to see details and numeric IDs.
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
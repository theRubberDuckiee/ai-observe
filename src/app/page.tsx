'use client'

import { useState } from 'react'
import Dashboard from '@/components/Dashboard'
import TokenVisualization from '@/components/TokenVisualization'

const MODELS = [
  'gpt-4o',
  'gpt-4o-mini',
  'gpt-3.5-turbo',
]

export default function Home() {
  const [prompt, setPrompt] = useState('')
  const [model, setModel] = useState(MODELS[0])
  const [response, setResponse] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [metrics, setMetrics] = useState<any>(null)
  const [tokenBreakdown, setTokenBreakdown] = useState<any>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!prompt.trim()) return

    setIsLoading(true)
    setResponse('')
    
    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ prompt, model }),
      })

      const data = await res.json()

      if (res.ok) {
        setResponse(data.response)
        setMetrics({
          tokensIn: data.tokensIn,
          tokensOut: data.tokensOut,
          latencyMs: data.latencyMs,
        })
        setTokenBreakdown(data.tokenBreakdown)
      } else {
        setResponse(`Error: ${data.error}`)
        setTokenBreakdown(null)
      }
    } catch (error) {
      setResponse('Error: Failed to send request')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8" style={{ backgroundColor: '#000000' }}>
      <div className="max-w-7xl mx-auto px-4">
        <h1 className="text-3xl font-bold text-gray-900 mb-8" style={{ color: '#ffffff' }}>AI Observe</h1>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="bg-white p-6 rounded-lg shadow" style={{ backgroundColor: '#111111', border: '1px solid #333333' }}>
            <h2 className="text-xl font-semibold mb-4" style={{ color: '#ffffff' }}>Send Prompt</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Model
                </label>
                <select
                  value={model}
                  onChange={(e) => setModel(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {MODELS.map((m) => (
                    <option key={m} value={m}>
                      {m}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Prompt
                </label>
                <textarea
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter your prompt..."
                />
              </div>

              <button
                type="submit"
                disabled={isLoading || !prompt.trim()}
                className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:bg-gray-400"
                style={{ 
                  backgroundColor: isLoading || !prompt.trim() ? '#444444' : '#ffffff',
                  color: isLoading || !prompt.trim() ? '#888888' : '#000000',
                  border: '1px solid #666666'
                }}
              >
                {isLoading ? 'Sending...' : 'Send'}
              </button>
            </form>

            {response && (
              <div className="mt-6">
                <h3 className="text-lg font-semibold mb-2">Response</h3>
                <div className="bg-gray-100 p-4 rounded-md">
                  <pre className="whitespace-pre-wrap text-sm">{response}</pre>
                </div>
                {metrics && (
                  <div className="mt-4 grid grid-cols-3 gap-4 text-sm">
                    <div>
                      <span className="font-medium">Tokens In:</span> {metrics.tokensIn}
                    </div>
                    <div>
                      <span className="font-medium">Tokens Out:</span> {metrics.tokensOut}
                    </div>
                    <div>
                      <span className="font-medium">Latency:</span> {metrics.latencyMs}ms
                    </div>
                  </div>
                )}
                <TokenVisualization tokenBreakdown={tokenBreakdown} model={model} />
              </div>
            )}
          </div>

          <div className="bg-white p-6 rounded-lg shadow" style={{ backgroundColor: '#111111', border: '1px solid #333333' }}>
            <Dashboard />
          </div>
        </div>
      </div>
    </div>
  )
}

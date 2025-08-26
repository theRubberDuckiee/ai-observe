'use client'

import { useState } from 'react'
import Dashboard from '@/components/Dashboard'

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
      } else {
        setResponse(`Error: ${data.error}`)
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
          <div className="border border-white p-6 rounded-lg">
            <h2 className="text-xl font-semibold mb-4 text-white">Send Prompt</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-white mb-2">
                  Model
                </label>
                <select
                  value={model}
                  onChange={(e) => setModel(e.target.value)}
                  className="w-full px-3 py-2 border border-white bg-black text-white rounded-md focus:outline-none focus:ring-2 focus:ring-white"
                >
                  {MODELS.map((m) => (
                    <option key={m} value={m} style={{ backgroundColor: '#000000', color: '#ffffff' }}>
                      {m}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-white mb-2">
                  Prompt
                </label>
                <textarea
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  rows={4}
                  className="w-full px-3 py-2 border border-white bg-black text-white rounded-md focus:outline-none focus:ring-2 focus:ring-white"
                  placeholder="Enter your prompt..."
                  style={{ backgroundColor: '#000000', color: '#ffffff' }}
                />
              </div>

              <button
                type="submit"
                disabled={isLoading || !prompt.trim()}
                className="w-full py-2 px-4 rounded-md border border-white"
                style={{ 
                  backgroundColor: isLoading || !prompt.trim() ? '#333333' : '#ffffff',
                  color: isLoading || !prompt.trim() ? '#888888' : '#000000'
                }}
              >
                {isLoading ? 'Sending...' : 'Send'}
              </button>
            </form>

            {response && (
              <div className="mt-6">
                <h3 className="text-lg font-semibold mb-2 text-white">Response</h3>
                <div className="bg-black border border-white p-4 rounded-md">
                  <pre className="whitespace-pre-wrap text-sm text-white">{response}</pre>
                </div>
                {metrics && (
                  <div className="mt-4 grid grid-cols-3 gap-4 text-sm">
                    <div className="text-white">
                      <span className="font-medium">Tokens In:</span> {metrics.tokensIn}
                    </div>
                    <div className="text-white">
                      <span className="font-medium">Tokens Out:</span> {metrics.tokensOut}
                    </div>
                    <div className="text-white">
                      <span className="font-medium">Latency:</span> {metrics.latencyMs}ms
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="border border-white p-6 rounded-lg">
            <Dashboard />
          </div>
        </div>
      </div>
    </div>
  )
}

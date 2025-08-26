'use client'

import { useState, useEffect } from 'react'

interface Metric {
  id: string
  createdAt: string
  model: string
  promptChars: number
  tokensIn: number
  tokensOut: number
  latencyMs: number
  status: string
  error?: string
}

interface MetricsData {
  recentRequests: Metric[]
  stats: {
    totalRequests: number
    successfulRequests: number
    errorRequests: number
    successRate: number
    totalTokensIn: number
    totalTokensOut: number
    avgLatencyMs: number
  }
}

export default function Dashboard() {
  const [data, setData] = useState<MetricsData | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const fetchMetrics = async () => {
    try {
      const res = await fetch('/api/metrics')
      const metricsData = await res.json()
      setData(metricsData)
    } catch (error) {
      console.error('Failed to fetch metrics:', error)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchMetrics()
    const interval = setInterval(fetchMetrics, 3000)
    return () => clearInterval(interval)
  }, [])

  if (isLoading) {
    return <div className="text-center">Loading metrics...</div>
  }

  if (!data) {
    return <div className="text-center text-red-600">Failed to load metrics</div>
  }

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold">Dashboard</h2>
      
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-blue-50 p-4 rounded-lg">
          <h3 className="text-sm font-medium text-gray-700">Total Requests</h3>
          <p className="text-2xl font-bold text-blue-600">{data.stats.totalRequests}</p>
        </div>
        
        <div className="bg-green-50 p-4 rounded-lg">
          <h3 className="text-sm font-medium text-gray-700">Success Rate</h3>
          <p className="text-2xl font-bold text-green-600">{data.stats.successRate.toFixed(1)}%</p>
        </div>
        
        <div className="bg-purple-50 p-4 rounded-lg">
          <h3 className="text-sm font-medium text-gray-700">Avg Latency</h3>
          <p className="text-2xl font-bold text-purple-600">{data.stats.avgLatencyMs}ms</p>
        </div>
        
        <div className="bg-orange-50 p-4 rounded-lg">
          <h3 className="text-sm font-medium text-gray-700">Total Tokens</h3>
          <p className="text-lg font-bold text-orange-600">
            {(data.stats.totalTokensIn + data.stats.totalTokensOut).toLocaleString()}
          </p>
        </div>
      </div>

      <div>
        <h3 className="text-lg font-semibold mb-3">Recent Requests</h3>
        <div className="space-y-2 max-h-64 overflow-y-auto">
          {data.recentRequests.length === 0 ? (
            <p className="text-gray-500 text-center py-4">No requests yet</p>
          ) : (
            data.recentRequests.map((req) => (
              <div
                key={req.id}
                className={`p-3 rounded-lg border ${
                  req.status === 'ok'
                    ? 'bg-green-50 border-green-200'
                    : 'bg-red-50 border-red-200'
                }`}
              >
                <div className="flex justify-between items-start">
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="font-medium text-sm">{req.model}</span>
                      <span
                        className={`px-2 py-1 rounded-full text-xs ${
                          req.status === 'ok'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {req.status}
                      </span>
                    </div>
                    <p className="text-xs text-gray-600 mt-1">
                      {req.promptChars} chars • {req.tokensIn + req.tokensOut} tokens • {req.latencyMs}ms
                    </p>
                    {req.error && (
                      <p className="text-xs text-red-600 mt-1">{req.error}</p>
                    )}
                  </div>
                  <div className="text-xs text-gray-500">
                    {new Date(req.createdAt).toLocaleTimeString()}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
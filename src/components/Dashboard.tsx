'use client'

import { useState, useEffect } from 'react'
import TokenVisualization from './TokenVisualization'

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
  latestTokenBreakdown?: any
  latestModel?: string
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
    return <div className="text-center text-white">Loading metrics...</div>
  }

  if (!data) {
    return <div className="text-center text-white">Failed to load metrics</div>
  }

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold text-white">Dashboard</h2>
      
      <div className="grid grid-cols-2 gap-4">
        <div className="border border-white p-4 rounded-lg">
          <h3 className="text-sm font-medium text-white">Total Requests</h3>
          <p className="text-2xl font-bold text-white">{data.stats.totalRequests}</p>
        </div>
        
        <div className="border border-white p-4 rounded-lg">
          <h3 className="text-sm font-medium text-white">Success Rate</h3>
          <p className="text-2xl font-bold text-white">{data.stats.successRate.toFixed(1)}%</p>
        </div>
        
        <div className="border border-white p-4 rounded-lg">
          <h3 className="text-sm font-medium text-white">Avg Latency</h3>
          <p className="text-2xl font-bold text-white">{data.stats.avgLatencyMs}ms</p>
        </div>
        
        <div className="border border-white p-4 rounded-lg">
          <h3 className="text-sm font-medium text-white">Total Tokens</h3>
          <p className="text-lg font-bold text-white">
            {(data.stats.totalTokensIn + data.stats.totalTokensOut).toLocaleString()}
          </p>
        </div>
      </div>

      <div>
        <h3 className="text-lg font-semibold mb-3 text-white">Latest Token Breakdown</h3>
        {data.latestTokenBreakdown ? (
          <TokenVisualization 
            tokenBreakdown={data.latestTokenBreakdown} 
            model={data.latestModel || 'gpt-4o-mini'} 
          />
        ) : (
          <div className="p-4 border border-white rounded-lg">
            <p className="text-gray-400 text-center">Send a request to see token breakdown</p>
          </div>
        )}
      </div>
    </div>
  )
}
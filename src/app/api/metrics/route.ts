import { NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function GET() {
  try {
    const recentRequests = await prisma.metric.findMany({
      orderBy: { createdAt: 'desc' },
      take: 50,
    })

    const totalRequests = await prisma.metric.count()
    const successfulRequests = await prisma.metric.count({
      where: { status: 'ok' },
    })
    const errorRequests = await prisma.metric.count({
      where: { status: 'error' },
    })

    const totalTokensIn = await prisma.metric.aggregate({
      _sum: { tokensIn: true },
      where: { status: 'ok' },
    })

    const totalTokensOut = await prisma.metric.aggregate({
      _sum: { tokensOut: true },
      where: { status: 'ok' },
    })

    const avgLatency = await prisma.metric.aggregate({
      _avg: { latencyMs: true },
      where: { status: 'ok' },
    })

    const stats = {
      totalRequests,
      successfulRequests,
      errorRequests,
      successRate: totalRequests > 0 ? (successfulRequests / totalRequests) * 100 : 0,
      totalTokensIn: totalTokensIn._sum.tokensIn || 0,
      totalTokensOut: totalTokensOut._sum.tokensOut || 0,
      avgLatencyMs: Math.round(avgLatency._avg.latencyMs || 0),
    }

    return NextResponse.json({
      recentRequests,
      stats,
    })
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
}
import { useEffect, useMemo, useState } from "react"
import { Flame } from "lucide-react"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  fetchDailyStats,
  fetchStats,
  type DailyStat,
  type StatsOverview,
} from "@/lib/api"

function formatDayLabel(dateStr: string): string {
  const date = new Date(dateStr + "T00:00:00")
  return date.toLocaleDateString("en-US", { weekday: "short" })
}

export function StatsPage() {
  const [stats, setStats] = useState<StatsOverview | null>(null)
  const [dailyStats, setDailyStats] = useState<DailyStat[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    Promise.all([fetchStats(), fetchDailyStats(7)])
      .then(([statsData, dailyData]) => {
        setStats(statsData)
        setDailyStats(dailyData)
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return <div className="text-muted-foreground">Loading stats...</div>
  }

  if (error) {
    return <div className="text-destructive">Error: {error}</div>
  }

  if (!stats) {
    return <div className="text-muted-foreground">No stats available</div>
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Stats</h1>

      {/* Streak Display */}
      <div className="flex items-center justify-center gap-3 py-6">
        <Flame className="h-12 w-12 text-orange-500" />
        <div className="text-center">
          <span className="text-5xl font-bold text-orange-500">{stats.streak}</span>
          <p className="text-sm text-muted-foreground">day streak</p>
        </div>
      </div>

      {/* Activity Summary Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Answered
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{stats.total}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Today
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{stats.today}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              This Week
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{stats.thisWeek}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Accuracy
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{stats.accuracy}%</p>
          </CardContent>
        </Card>
      </div>

      {/* Daily Activity Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Daily Activity (Last 7 Days)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <DailyActivityChart dailyStats={dailyStats} />
        </CardContent>
      </Card>
    </div>
  )
}

function DailyActivityChart({ dailyStats }: { dailyStats: DailyStat[] }) {
  // Build data for last 7 days, filling in missing days with zeros
  const chartData = useMemo(() => {
    const days: Array<{ date: string; count: number; accuracy: number }> = []
    const today = new Date()

    // Create map of existing data
    const dataMap = new Map<string, DailyStat>()
    dailyStats.forEach((d) => dataMap.set(d.date, d))

    // Build 7 days of data
    for (let i = 6; i >= 0; i--) {
      const date = new Date(today)
      date.setDate(date.getDate() - i)
      const dateStr = date.toISOString().split("T")[0]
      const existing = dataMap.get(dateStr)
      days.push({
        date: dateStr,
        count: existing?.count ?? 0,
        accuracy: existing?.accuracy ?? 0,
      })
    }

    return days
  }, [dailyStats])

  const maxCount = useMemo(
    () => Math.max(...chartData.map((d) => d.count), 1),
    [chartData]
  )

  if (chartData.every((d) => d.count === 0)) {
    return (
      <div className="flex h-40 items-center justify-center text-muted-foreground">
        No activity in the last 7 days
      </div>
    )
  }

  // Build SVG path for area chart
  const chartHeight = 120
  const chartWidth = 100 // percentage-based
  const points = chartData.map((day, i) => {
    const x = (i / (chartData.length - 1)) * chartWidth
    const y = chartHeight - (day.count / maxCount) * chartHeight
    return { x, y, ...day }
  })

  // Create smooth line path
  const linePath = points
    .map((p, i) => (i === 0 ? `M ${p.x} ${p.y}` : `L ${p.x} ${p.y}`))
    .join(" ")

  // Create area path (line + close to bottom)
  const areaPath = `${linePath} L ${chartWidth} ${chartHeight} L 0 ${chartHeight} Z`

  return (
    <div className="space-y-2">
      <svg
        viewBox={`0 0 ${chartWidth} ${chartHeight}`}
        preserveAspectRatio="none"
        className="h-32 w-full"
      >
        {/* Gradient definition */}
        <defs>
          <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="rgb(34, 197, 94)" stopOpacity="0.4" />
            <stop offset="100%" stopColor="rgb(34, 197, 94)" stopOpacity="0.05" />
          </linearGradient>
        </defs>

        {/* Area fill */}
        <path d={areaPath} fill="url(#areaGradient)" />

        {/* Line stroke */}
        <path
          d={linePath}
          fill="none"
          stroke="rgb(34, 197, 94)"
          strokeWidth="2"
          vectorEffect="non-scaling-stroke"
        />

        {/* Data points */}
        {points.map((p, i) => (
          <circle
            key={i}
            cx={p.x}
            cy={p.y}
            r="3"
            fill="rgb(34, 197, 94)"
            vectorEffect="non-scaling-stroke"
          >
            <title>{`${p.count} attempts, ${p.accuracy}% accuracy`}</title>
          </circle>
        ))}
      </svg>

      {/* Date labels */}
      <div className="flex justify-between px-1">
        {chartData.map((day) => (
          <span key={day.date} className="text-xs text-muted-foreground">
            {formatDayLabel(day.date)}
          </span>
        ))}
      </div>
    </div>
  )
}

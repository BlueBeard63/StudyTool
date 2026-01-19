import { useEffect, useMemo, useState } from "react"
import { Area, AreaChart, XAxis, YAxis } from "recharts"
import { Flame } from "lucide-react"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart"
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

const chartConfig = {
  count: {
    label: "Attempts",
    color: "hsl(142, 76%, 36%)",
  },
} satisfies ChartConfig

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
    const days: Array<{ date: string; day: string; count: number; accuracy: number }> = []
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
        day: formatDayLabel(dateStr),
        count: existing?.count ?? 0,
        accuracy: existing?.accuracy ?? 0,
      })
    }

    return days
  }, [dailyStats])

  if (chartData.every((d) => d.count === 0)) {
    return (
      <div className="flex h-40 items-center justify-center text-muted-foreground">
        No activity in the last 7 days
      </div>
    )
  }

  return (
    <ChartContainer config={chartConfig} className="h-40 w-full">
      <AreaChart
        data={chartData}
        margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
      >
        <defs>
          <linearGradient id="fillCount" x1="0" y1="0" x2="0" y2="1">
            <stop
              offset="5%"
              stopColor="var(--color-count)"
              stopOpacity={0.4}
            />
            <stop
              offset="95%"
              stopColor="var(--color-count)"
              stopOpacity={0.05}
            />
          </linearGradient>
        </defs>
        <XAxis
          dataKey="day"
          tickLine={false}
          axisLine={false}
          tickMargin={8}
        />
        <YAxis
          tickLine={false}
          axisLine={false}
          tickMargin={8}
          allowDecimals={false}
        />
        <ChartTooltip
          content={
            <ChartTooltipContent
              labelFormatter={(_, payload) => {
                if (payload?.[0]?.payload) {
                  const data = payload[0].payload as { accuracy: number }
                  return `${data.accuracy}% accuracy`
                }
                return ""
              }}
            />
          }
        />
        <Area
          type="monotone"
          dataKey="count"
          stroke="var(--color-count)"
          strokeWidth={2}
          fill="url(#fillCount)"
        />
      </AreaChart>
    </ChartContainer>
  )
}

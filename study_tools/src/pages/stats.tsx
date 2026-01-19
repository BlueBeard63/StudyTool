import { useEffect, useState } from "react"
import { Flame } from "lucide-react"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  fetchDailyStats,
  fetchStats,
  type DailyStat,
  type StatsOverview,
} from "@/lib/api"

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

      {/* Chart will be added in subsequent task */}
    </div>
  )
}

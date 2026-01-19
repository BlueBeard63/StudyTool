import { useEffect, useState } from "react"

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
      {/* Streak, cards, and chart will be added in subsequent tasks */}
    </div>
  )
}

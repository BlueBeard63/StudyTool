import { useEffect, useState } from "react"
import { Link } from "react-router"
import { Calendar, Clock, Target, Trophy } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { fetchSessions, fetchSets, type QuestionSet, type Session } from "@/lib/api"
import { cn } from "@/lib/utils"

function formatDuration(seconds: number | null): string {
  if (seconds === null) return "—"
  if (seconds < 60) return `${seconds}s`
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  return secs > 0 ? `${mins}m ${secs}s` : `${mins}m`
}

function formatDate(isoString: string): string {
  const date = new Date(isoString)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

  if (diffDays === 0) {
    return date.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
    })
  } else if (diffDays === 1) {
    return "Yesterday"
  } else if (diffDays < 7) {
    return date.toLocaleDateString("en-US", { weekday: "long" })
  } else {
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    })
  }
}

function ScoreBadge({ score }: { score: number }) {
  const percent = Math.round(score * 100)
  const colorClass =
    percent >= 80
      ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
      : percent >= 60
        ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400"
        : "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400"

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
        colorClass
      )}
    >
      {percent}%
    </span>
  )
}

interface SessionWithSetName extends Session {
  setName?: string
}

export function HistoryPage() {
  const [sessions, setSessions] = useState<SessionWithSetName[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    Promise.all([fetchSessions(undefined, 50), fetchSets()])
      .then(([sessionsData, setsData]) => {
        // Create a map of setId to set name
        const setMap = new Map<string, string>()
        setsData.forEach((set: QuestionSet) => {
          setMap.set(set.id, set.name)
        })

        // Attach set names to sessions
        const sessionsWithNames = sessionsData.map((session) => ({
          ...session,
          setName: setMap.get(session.setId) ?? "Unknown Set",
        }))

        setSessions(sessionsWithNames)
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return <div className="text-muted-foreground">Loading history...</div>
  }

  if (error) {
    return <div className="text-destructive">Error: {error}</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Study History</h1>
      </div>

      {sessions.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center">
            <p className="text-muted-foreground">
              No study sessions yet. Start studying to see your history!
            </p>
            <Link to="/">
              <Button className="mt-4">Browse Sets</Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {sessions.map((session) => (
            <Card key={session.id} className="overflow-hidden">
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-base font-medium">
                      {session.setName}
                    </CardTitle>
                    <CardDescription className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {formatDate(session.completedAt)}
                    </CardDescription>
                  </div>
                  <ScoreBadge score={session.score} />
                </div>
              </CardHeader>
              <CardContent className="pb-4">
                <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Target className="h-4 w-4" />
                    <span>
                      {session.correctCount}/{session.questionsAnswered} correct
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Clock className="h-4 w-4" />
                    <span>{formatDuration(session.duration)}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Trophy className="h-4 w-4" />
                    <span className="capitalize">{session.mode}</span>
                  </div>
                </div>
                <div className="mt-2 flex gap-2">
                  <span className="inline-flex items-center rounded-md bg-muted px-2 py-1 text-xs">
                    {session.difficulty}
                  </span>
                  <span className="inline-flex items-center rounded-md bg-muted px-2 py-1 text-xs">
                    {session.inputMethod}
                  </span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}

import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import type { SessionState } from "@/lib/session"

interface SessionSummaryProps {
  session: SessionState
  setName: string
  onRetry: () => void
  onBack: () => void
}

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${m}:${s.toString().padStart(2, "0")}`
}

export function SessionSummary({
  session,
  setName,
  onRetry,
  onBack,
}: SessionSummaryProps) {
  const percentage = Math.round(session.totalScore * 100)

  // Calculate time used for timed mode
  const timeUsed =
    session.mode === "timed" && session.timerDuration !== null
      ? session.timerDuration - (session.timeRemaining ?? 0)
      : null

  const avgTimePerQuestion =
    timeUsed !== null && session.questionsAnswered > 0
      ? timeUsed / session.questionsAnswered
      : null

  return (
    <Card>
      <CardHeader className="text-center">
        <CardTitle className="text-2xl">
          {session.mode === "timed" ? "Time's Up!" : "Session Complete!"}
        </CardTitle>
        <CardDescription>{setName}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="text-center">
          <div className="text-5xl font-bold">{percentage}%</div>
          <div className="mt-1 text-muted-foreground">
            {session.correctCount} of {session.questionsAnswered} correct
          </div>
          {session.mode === "timed" && timeUsed !== null && (
            <div className="mt-2 text-sm text-muted-foreground">
              Time: {formatDuration(timeUsed)}
              {avgTimePerQuestion !== null && (
                <span className="ml-2">
                  ({avgTimePerQuestion.toFixed(1)}s per question)
                </span>
              )}
            </div>
          )}
        </div>

        <div className="h-3 overflow-hidden rounded-full bg-muted">
          <div
            className="h-full rounded-full bg-primary transition-all duration-500"
            style={{ width: `${percentage}%` }}
          />
        </div>

        <div className="flex justify-center gap-3 pt-2">
          <Button onClick={onRetry} variant="outline">
            Study Again
          </Button>
          <Button onClick={onBack}>Back to Sets</Button>
        </div>
      </CardContent>
    </Card>
  )
}

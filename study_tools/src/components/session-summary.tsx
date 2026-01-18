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

export function SessionSummary({
  session,
  setName,
  onRetry,
  onBack,
}: SessionSummaryProps) {
  const percentage = Math.round(session.totalScore * 100)

  return (
    <Card>
      <CardHeader className="text-center">
        <CardTitle className="text-2xl">Session Complete!</CardTitle>
        <CardDescription>{setName}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="text-center">
          <div className="text-5xl font-bold">{percentage}%</div>
          <div className="mt-1 text-muted-foreground">
            {session.correctCount} of {session.questionsAnswered} correct
          </div>
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

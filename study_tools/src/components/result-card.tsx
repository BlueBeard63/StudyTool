import { Star } from "lucide-react"

import { Card, CardContent, CardHeader } from "@/components/ui/card"
import type { QuestionResult } from "@/lib/session"
import { cn } from "@/lib/utils"

interface ResultCardProps {
  result: QuestionResult
  bookmarked: boolean
  onToggleBookmark: (id: string) => void
}

export function ResultCard({
  result,
  bookmarked,
  onToggleBookmark,
}: ResultCardProps) {
  const correctCount = result.userAnswers.filter(
    (answer, i) =>
      answer.toLowerCase().trim() ===
      result.correctAnswers[i]?.toLowerCase().trim()
  ).length
  const totalBlanks = result.correctAnswers.length

  return (
    <Card className="hover:ring-2 hover:ring-primary/20 transition-all">
      <CardHeader>
        <div className="flex items-start justify-between gap-3">
          <div className="text-sm font-medium leading-relaxed">{result.question}</div>
          <button
            onClick={() => onToggleBookmark(result.questionId)}
            className="shrink-0 p-1 -m-1 text-muted-foreground hover:text-yellow-500 transition-colors rounded-md hover:bg-muted"
            title={bookmarked ? "Remove bookmark" : "Bookmark question"}
          >
            <Star
              className={cn(
                "h-4 w-4",
                bookmarked && "fill-yellow-500 text-yellow-500"
              )}
            />
          </button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          {result.correctAnswers.map((correct, i) => {
            const userAnswer = result.userAnswers[i] || ""
            const isCorrect =
              userAnswer.toLowerCase().trim() === correct.toLowerCase().trim()

            return (
              <div key={i} className="flex flex-wrap items-center gap-2 text-sm">
                <span className="text-muted-foreground shrink-0">Blank {i + 1}:</span>
                <span
                  className={cn(
                    "font-medium px-2 py-0.5 rounded-md",
                    isCorrect
                      ? "bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-300"
                      : "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300"
                  )}
                >
                  {userAnswer || "(empty)"}
                </span>
                {!isCorrect && (
                  <>
                    <span className="text-muted-foreground">→</span>
                    <span className="font-medium text-green-600 dark:text-green-400">
                      {correct}
                    </span>
                  </>
                )}
              </div>
            )
          })}
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t">
          <span className="text-sm text-muted-foreground">
            {correctCount}/{totalBlanks} blanks correct
          </span>
          {result.hintsUsed !== undefined && result.hintsUsed > 0 && (
            <span className="text-xs text-muted-foreground">
              {result.hintsUsed} hint{result.hintsUsed !== 1 ? "s" : ""} used
            </span>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

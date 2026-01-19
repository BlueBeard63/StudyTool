import { useState } from "react"

import { Button } from "@/components/ui/button"
import { ResultCard } from "@/components/result-card"
import type { QuestionResult } from "@/lib/session"

type TabType = "all" | "correct" | "partial" | "wrong"

interface SessionResultsProps {
  results: QuestionResult[]
  bookmarks: Record<string, boolean>
  onToggleBookmark: (id: string) => void
  mode: "practice" | "timed"
  timerDuration: number | null
  startTime: number | null
  setName: string
  onRetry: () => void
  onBack: () => void
}

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${m}:${s.toString().padStart(2, "0")}`
}

export function SessionResults({
  results,
  bookmarks,
  onToggleBookmark,
  mode,
  timerDuration,
  startTime,
  setName,
  onRetry,
  onBack,
}: SessionResultsProps) {
  const [activeTab, setActiveTab] = useState<TabType>("all")

  // Calculate overall stats
  const totalScore = results.length > 0
    ? results.reduce((sum, r) => sum + r.score, 0) / results.length
    : 0
  const percentage = Math.round(totalScore * 100)

  // Calculate time used for timed mode
  const timeUsed =
    mode === "timed" && timerDuration !== null && startTime !== null
      ? Math.floor((Date.now() - startTime) / 1000)
      : null

  // Filtering logic:
  // - Correct: score === 1 (all blanks correct)
  // - Partial: score > 0 && score < 1 (some blanks correct)
  // - Wrong: score === 0 (no blanks correct)
  const isCorrect = (r: QuestionResult) => r.score === 1
  const isPartial = (r: QuestionResult) => r.score > 0 && r.score < 1
  const isWrong = (r: QuestionResult) => r.score === 0

  // Count results by category
  const correctCount = results.filter(isCorrect).length
  const partialCount = results.filter(isPartial).length
  const wrongCount = results.filter(isWrong).length

  // Filter results based on active tab
  const filteredResults = results.filter((r) => {
    switch (activeTab) {
      case "correct":
        return isCorrect(r)
      case "partial":
        return isPartial(r)
      case "wrong":
        return isWrong(r)
      default:
        return true
    }
  })

  const tabs: { key: TabType; label: string; count: number }[] = [
    { key: "all", label: "All", count: results.length },
    { key: "correct", label: "Correct", count: correctCount },
    { key: "partial", label: "Partial", count: partialCount },
    { key: "wrong", label: "Wrong", count: wrongCount },
  ]

  return (
    <div className="space-y-6">
      {/* Summary stats header */}
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold">
          {mode === "timed" ? "Time's Up!" : "Session Complete!"}
        </h2>
        <p className="text-sm text-muted-foreground">{setName}</p>
        <div className="text-5xl font-bold">{percentage}%</div>
        <div className="text-muted-foreground">
          {correctCount} of {results.length} fully correct
        </div>
        {mode === "timed" && timeUsed !== null && (
          <div className="text-sm text-muted-foreground">
            Time: {formatDuration(timeUsed)}
          </div>
        )}
        <div className="h-3 overflow-hidden rounded-full bg-muted max-w-md mx-auto">
          <div
            className="h-full rounded-full bg-primary transition-all duration-500"
            style={{ width: `${percentage}%` }}
          />
        </div>
      </div>

      {/* Tab buttons */}
      <div className="flex flex-wrap gap-2 justify-center">
        {tabs.map((tab) => (
          <Button
            key={tab.key}
            variant={activeTab === tab.key ? "default" : "outline"}
            size="sm"
            onClick={() => setActiveTab(tab.key)}
          >
            {tab.label} ({tab.count})
          </Button>
        ))}
      </div>

      {/* Result cards */}
      <div className="space-y-4">
        {filteredResults.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            {activeTab === "correct" && "No fully correct answers yet"}
            {activeTab === "partial" && "No partial answers"}
            {activeTab === "wrong" && "No wrong answers - great job!"}
            {activeTab === "all" && "No questions answered"}
          </div>
        ) : (
          filteredResults.map((result) => (
            <ResultCard
              key={result.questionId}
              result={result}
              bookmarked={bookmarks[result.questionId] ?? false}
              onToggleBookmark={onToggleBookmark}
            />
          ))
        )}
      </div>

      {/* Action buttons */}
      <div className="flex justify-center gap-3 pt-2">
        <Button onClick={onRetry} variant="outline">
          Study Again
        </Button>
        <Button onClick={onBack}>Back to Sets</Button>
      </div>
    </div>
  )
}

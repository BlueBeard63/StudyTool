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

export function SessionResults({
  results,
  bookmarks,
  onToggleBookmark,
  onRetry,
  onBack,
}: SessionResultsProps) {
  const [activeTab, setActiveTab] = useState<TabType>("all")

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
      {/* Tab buttons */}
      <div className="flex flex-wrap gap-2">
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
        {filteredResults.map((result) => (
          <ResultCard
            key={result.questionId}
            result={result}
            bookmarked={bookmarks[result.questionId] ?? false}
            onToggleBookmark={onToggleBookmark}
          />
        ))}
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

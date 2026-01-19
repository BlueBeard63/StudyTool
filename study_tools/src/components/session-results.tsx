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

  // Count results by category
  const correctCount = results.filter((r) => r.score === 1).length
  const partialCount = results.filter((r) => r.score > 0 && r.score < 1).length
  const wrongCount = results.filter((r) => r.score === 0).length

  // Filter results based on active tab
  const filteredResults = results.filter((r) => {
    switch (activeTab) {
      case "correct":
        return r.score === 1
      case "partial":
        return r.score > 0 && r.score < 1
      case "wrong":
        return r.score === 0
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

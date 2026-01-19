import { useEffect, useState } from "react"
import { useNavigate } from "react-router"

import { SetCard } from "@/components/set-card"
import { DueReviewSection } from "@/components/due-review-section"
import { fetchSets, type QuestionSet } from "@/lib/api"

export function SetsPage() {
  const navigate = useNavigate()
  const [sets, setSets] = useState<QuestionSet[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Calculate total due count from all sets
  const totalDue = sets.reduce((sum, set) => sum + (set.dueCount || 0), 0)

  useEffect(() => {
    fetchSets()
      .then(setSets)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return <div className="text-muted-foreground">Loading...</div>
  }

  if (error) {
    return <div className="text-destructive">Error: {error}</div>
  }

  if (sets.length === 0) {
    return (
      <div className="py-12 text-center text-muted-foreground">
        <p className="text-lg font-medium">No question sets yet</p>
        <p className="mt-1 text-sm">Upload a JSON file to get started</p>
      </div>
    )
  }

  return (
    <div>
      <DueReviewSection
        totalDue={totalDue}
        onStartReview={() => navigate("/review")}
      />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {sets.map((set) => (
          <SetCard key={set.id} set={set} />
        ))}
      </div>
    </div>
  )
}

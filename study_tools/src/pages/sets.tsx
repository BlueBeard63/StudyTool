import { useEffect, useState } from "react"

import { SetCard } from "@/components/set-card"
import { fetchSets, type QuestionSet } from "@/lib/api"

export function SetsPage() {
  const [sets, setSets] = useState<QuestionSet[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

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
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {sets.map((set) => (
        <SetCard key={set.id} set={set} />
      ))}
    </div>
  )
}

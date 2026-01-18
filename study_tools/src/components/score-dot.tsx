import { cn } from "@/lib/utils"

interface ScoreDotProps {
  score: number | null
  size?: "sm" | "md"
}

function getScoreColor(score: number | null): string {
  if (score === null) return "bg-gray-300 dark:bg-gray-600"
  if (score >= 0.7) return "bg-green-500"
  if (score >= 0.3) return "bg-orange-500"
  return "bg-red-500"
}

export function ScoreDot({ score, size = "sm" }: ScoreDotProps) {
  const color = getScoreColor(score)
  const sizeClass = size === "sm" ? "h-2 w-2" : "h-3 w-3"

  return (
    <span
      className={cn("inline-block rounded-full", sizeClass, color)}
      title={score !== null ? `${Math.round(score * 100)}%` : "Not studied"}
    />
  )
}

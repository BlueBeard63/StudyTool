import { cn } from "@/lib/utils"

interface TimerDisplayProps {
  timeRemaining: number
}

export function TimerDisplay({ timeRemaining }: TimerDisplayProps) {
  const hours = Math.floor(timeRemaining / 3600)
  const minutes = Math.floor((timeRemaining % 3600) / 60)
  const seconds = timeRemaining % 60
  const isLow = timeRemaining <= 10

  // Use H:MM:SS format for durations >= 60 minutes
  const showHours = timeRemaining >= 3600

  return (
    <div
      className={cn(
        "text-2xl font-mono font-bold tabular-nums",
        isLow && "animate-pulse text-red-500"
      )}
    >
      {showHours
        ? `${hours}:${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`
        : `${minutes}:${seconds.toString().padStart(2, "0")}`}
    </div>
  )
}

import { cn } from "@/lib/utils"

interface TimerDisplayProps {
  timeRemaining: number
}

export function TimerDisplay({ timeRemaining }: TimerDisplayProps) {
  const minutes = Math.floor(timeRemaining / 60)
  const seconds = timeRemaining % 60
  const isLow = timeRemaining <= 10

  return (
    <div
      className={cn(
        "text-2xl font-mono font-bold tabular-nums",
        isLow && "animate-pulse text-red-500"
      )}
    >
      {minutes}:{seconds.toString().padStart(2, "0")}
    </div>
  )
}

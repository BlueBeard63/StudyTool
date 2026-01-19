import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface WordBankProps {
  words: string[] // All words that need to be placed
  usedIndices: Set<number> // Indices of words already placed in blanks
  selectedIndex: number | null // Currently selected word index
  onSelect: (index: number | null) => void
  disabled?: boolean
}

export function WordBank({
  words,
  usedIndices,
  selectedIndex,
  onSelect,
  disabled,
}: WordBankProps) {
  return (
    <div className="flex flex-wrap gap-2 p-4 border rounded-lg bg-muted/30">
      {words.map((word, i) => {
        const isUsed = usedIndices.has(i)
        const isSelected = selectedIndex === i

        return (
          <Button
            key={i}
            variant={isSelected ? "default" : "outline"}
            size="sm"
            disabled={disabled || isUsed}
            onClick={() => onSelect(isSelected ? null : i)}
            className={cn(
              "font-mono transition-all",
              isUsed && "opacity-40 line-through"
            )}
          >
            {word}
          </Button>
        )
      })}
    </div>
  )
}

import type { Token } from "@/lib/blanking"
import type { BlankResult } from "@/lib/checking"
import { cn } from "@/lib/utils"

interface WordBankBlankProps {
  tokens: Token[]
  values: string[] // Placed word values (empty string if not placed)
  selectedWordIndex: number | null // Currently selected word in bank
  onBlankClick: (blankIndex: number) => void // Called when a blank is clicked
  onPlacedWordClick: (blankIndex: number) => void // Called when a placed word is clicked
  disabled?: boolean
  results?: BlankResult[]
}

export function WordBankBlank({
  tokens,
  values,
  selectedWordIndex,
  onBlankClick,
  onPlacedWordClick,
  disabled,
  results,
}: WordBankBlankProps) {
  return (
    <div className="flex flex-wrap items-baseline gap-x-1 gap-y-2 text-base leading-relaxed">
      {tokens.map((token, i) => {
        if (token.isBlank) {
          const value = values[token.blankIndex] || ""
          const result = results?.[token.blankIndex]
          const minWidth = Math.max(token.text.length + 1, 4)
          const hasValue = value.length > 0
          const isClickable = !disabled && (selectedWordIndex !== null || hasValue)

          return (
            <span key={i} className="inline-flex flex-col items-center">
              <button
                type="button"
                disabled={disabled || (!hasValue && selectedWordIndex === null)}
                onClick={() => {
                  if (hasValue) {
                    onPlacedWordClick(token.blankIndex)
                  } else if (selectedWordIndex !== null) {
                    onBlankClick(token.blankIndex)
                  }
                }}
                className={cn(
                  "inline-flex items-center justify-center h-7 px-1.5 text-center font-mono font-medium",
                  "border rounded-md transition-all",
                  "focus:outline-none focus:ring-2 focus:ring-primary/50",
                  // Empty blank states
                  !hasValue && !result && "border-dashed border-muted-foreground/50 bg-muted/30",
                  !hasValue && !result && isClickable && "hover:border-primary hover:bg-primary/10 cursor-pointer",
                  !hasValue && !result && !isClickable && "cursor-default",
                  // Filled blank states
                  hasValue && !result && "border-solid border-primary bg-primary/10 text-primary cursor-pointer hover:bg-primary/20",
                  // Result states
                  result?.isCorrect === true && "border-green-500 bg-green-50 text-green-700 dark:bg-green-950 dark:text-green-300",
                  result?.isCorrect === false && "border-red-500 bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-300"
                )}
                style={{ minWidth: `${minWidth}ch` }}
              >
                {hasValue ? value : "___"}
              </button>
              {result?.isCorrect === false && (
                <span className="mt-0.5 text-xs text-green-600 dark:text-green-400">
                  {result.correctAnswer}
                </span>
              )}
            </span>
          )
        }

        // Non-blank token: render as text
        if (/^\s+$/.test(token.text)) {
          return <span key={i}>{token.text}</span>
        }

        return (
          <span key={i} className="whitespace-pre">
            {token.text}
          </span>
        )
      })}
    </div>
  )
}

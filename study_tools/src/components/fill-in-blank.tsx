import { Input } from "@/components/ui/input"
import type { Token } from "@/lib/blanking"
import type { BlankResult } from "@/lib/checking"
import { cn } from "@/lib/utils"

interface FillInBlankProps {
  tokens: Token[]
  values: string[]
  onChange: (blankIndex: number, value: string) => void
  disabled?: boolean
  results?: BlankResult[] // Show feedback when provided
}

export function FillInBlank({
  tokens,
  values,
  onChange,
  disabled,
  results,
}: FillInBlankProps) {
  return (
    <div className="flex flex-wrap items-baseline gap-x-1 gap-y-2 text-base leading-relaxed">
      {tokens.map((token, i) => {
        if (token.isBlank) {
          const value = values[token.blankIndex] || ""
          const result = results?.[token.blankIndex]
          const minWidth = Math.max(token.text.length * 0.6, 3)

          return (
            <span key={i} className="inline-flex flex-col items-center">
              <Input
                value={value}
                onChange={(e) => onChange(token.blankIndex, e.target.value)}
                disabled={disabled}
                className={cn(
                  "inline-block h-7 px-1.5 text-center font-medium",
                  "focus:ring-2 focus:ring-primary/50",
                  result?.isCorrect === true &&
                    "border-green-500 bg-green-50 text-green-700 dark:bg-green-950 dark:text-green-300",
                  result?.isCorrect === false &&
                    "border-red-500 bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-300"
                )}
                style={{ width: `${minWidth}ch` }}
                placeholder="___"
                autoComplete="off"
                spellCheck={false}
              />
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

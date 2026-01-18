import { Input } from "@/components/ui/input"
import type { Token } from "@/lib/blanking"
import { cn } from "@/lib/utils"

interface FillInBlankProps {
  tokens: Token[]
  values: string[]
  onChange: (blankIndex: number, value: string) => void
  disabled?: boolean
}

export function FillInBlank({
  tokens,
  values,
  onChange,
  disabled,
}: FillInBlankProps) {
  return (
    <div className="flex flex-wrap items-baseline gap-x-1 gap-y-2 text-base leading-relaxed">
      {tokens.map((token, i) => {
        if (token.isBlank) {
          const value = values[token.blankIndex] || ""
          // Estimate input width based on word length
          const minWidth = Math.max(token.text.length * 0.6, 3)

          return (
            <Input
              key={i}
              value={value}
              onChange={(e) => onChange(token.blankIndex, e.target.value)}
              disabled={disabled}
              className={cn(
                "inline-block h-7 px-1.5 text-center font-medium",
                "focus:ring-2 focus:ring-primary/50"
              )}
              style={{ width: `${minWidth}ch` }}
              placeholder="___"
              autoComplete="off"
              spellCheck={false}
            />
          )
        }

        // Non-blank token: render as text
        // Preserve whitespace with appropriate rendering
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

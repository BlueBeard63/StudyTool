export interface Token {
  text: string
  isBlank: boolean
  blankIndex: number // Index among blanked tokens (-1 if not blank)
}

/**
 * Tokenize an answer string and randomly blank 30-50% of words.
 * Preserves punctuation and whitespace as separate tokens.
 */
export function tokenizeAndBlank(
  answer: string,
  blankPercent = 0.4
): Token[] {
  // Split into tokens, preserving whitespace and punctuation
  // This regex captures: sequences of word chars, whitespace, or punctuation
  const parts = answer.split(/(\s+|[.,!?;:'"()[\]{}]+)/).filter(Boolean)

  // Identify which tokens are "blankable" (contain at least one letter)
  const blankableIndices: number[] = []
  parts.forEach((part, i) => {
    if (/[a-zA-Z]/.test(part)) {
      blankableIndices.push(i)
    }
  })

  // Calculate how many to blank (30-50%, at least 1 if there are any words)
  const numBlankable = blankableIndices.length
  if (numBlankable === 0) {
    // No words to blank, return all as non-blank
    return parts.map((text) => ({ text, isBlank: false, blankIndex: -1 }))
  }

  const numToBlank = Math.max(1, Math.floor(numBlankable * blankPercent))

  // Randomly select which indices to blank
  const shuffled = [...blankableIndices].sort(() => Math.random() - 0.5)
  const indicesToBlank = new Set(shuffled.slice(0, numToBlank))

  // Build tokens array
  let blankCounter = 0
  return parts.map((text, i) => {
    const isBlank = indicesToBlank.has(i)
    const blankIndex = isBlank ? blankCounter++ : -1
    return { text, isBlank, blankIndex }
  })
}

/**
 * Get the correct answers for blanked tokens.
 * Returns array of correct values in blank order.
 */
export function getCorrectAnswers(tokens: Token[]): string[] {
  return tokens
    .filter((t) => t.isBlank)
    .sort((a, b) => a.blankIndex - b.blankIndex)
    .map((t) => t.text)
}

/**
 * Count how many blanks are in the token array.
 */
export function countBlanks(tokens: Token[]): number {
  return tokens.filter((t) => t.isBlank).length
}

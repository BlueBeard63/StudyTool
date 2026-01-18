/**
 * Calculate Levenshtein distance between two strings.
 * Returns the number of single-character edits needed to transform a into b.
 */
export function levenshteinDistance(a: string, b: string): number {
  const m = a.length
  const n = b.length

  // Create matrix
  const dp: number[][] = Array.from({ length: m + 1 }, () =>
    Array(n + 1).fill(0)
  )

  // Initialize base cases
  for (let i = 0; i <= m; i++) dp[i][0] = i
  for (let j = 0; j <= n; j++) dp[0][j] = j

  // Fill matrix
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (a[i - 1] === b[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1]
      } else {
        dp[i][j] = 1 + Math.min(
          dp[i - 1][j],     // deletion
          dp[i][j - 1],     // insertion
          dp[i - 1][j - 1]  // substitution
        )
      }
    }
  }

  return dp[m][n]
}

/**
 * Calculate similarity ratio (0-1) between two strings.
 * 1 = identical, 0 = completely different.
 * Case-insensitive comparison.
 */
export function similarity(a: string, b: string): number {
  const aLower = a.toLowerCase().trim()
  const bLower = b.toLowerCase().trim()

  const maxLen = Math.max(aLower.length, bLower.length)
  if (maxLen === 0) return 1 // Both empty = identical

  const distance = levenshteinDistance(aLower, bLower)
  return 1 - distance / maxLen
}

/**
 * Check if user answer is "close enough" to correct answer.
 * Default threshold: 0.8 (80% similar = correct)
 */
export function isCloseEnough(
  userAnswer: string,
  correctAnswer: string,
  threshold = 0.8
): boolean {
  return similarity(userAnswer, correctAnswer) >= threshold
}

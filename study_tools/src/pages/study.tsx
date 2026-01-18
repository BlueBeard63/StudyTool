import { useCallback, useEffect, useMemo, useState } from "react"
import { Link, useParams } from "react-router"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { FillInBlank } from "@/components/fill-in-blank"
import { fetchQuestions, recordAttempt, type Question } from "@/lib/api"
import { countBlanks, getCorrectAnswers, tokenizeAndBlank } from "@/lib/blanking"
import { checkAnswers, type CheckResult } from "@/lib/checking"

export function StudyPage() {
  const { setId } = useParams<{ setId: string }>()
  const [questions, setQuestions] = useState<Question[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [values, setValues] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [submitted, setSubmitted] = useState(false)
  const [results, setResults] = useState<CheckResult | null>(null)

  // Current question
  const currentQuestion = questions[currentIndex]

  // Tokenize current answer (memoized to keep blanks stable)
  const tokens = useMemo(() => {
    if (!currentQuestion) return []
    return tokenizeAndBlank(currentQuestion.answer)
  }, [currentQuestion])

  // Get correct answers for comparison
  const correctAnswers = useMemo(() => getCorrectAnswers(tokens), [tokens])

  // Fetch questions on mount
  useEffect(() => {
    if (!setId) return

    fetchQuestions(setId)
      .then((qs) => {
        setQuestions(qs)
        setLoading(false)
      })
      .catch((e) => {
        setError(e.message)
        setLoading(false)
      })
  }, [setId])

  // Reset values when question changes
  useEffect(() => {
    const numBlanks = countBlanks(tokens)
    setValues(new Array(numBlanks).fill(""))
    setSubmitted(false)
    setResults(null)
  }, [tokens])

  const handleChange = useCallback((blankIndex: number, value: string) => {
    setValues((prev) => {
      const next = [...prev]
      next[blankIndex] = value
      return next
    })
  }, [])

  const handleSubmit = useCallback(async () => {
    const checkResult = checkAnswers(values, correctAnswers)
    setResults(checkResult)
    setSubmitted(true)

    // Record attempt: correct if ≥50% of blanks are right
    const isCorrect = checkResult.score >= 0.5
    try {
      await recordAttempt(currentQuestion.id, isCorrect)
    } catch (e) {
      // Silent failure - don't block UX for tracking
      console.error("Failed to record attempt:", e)
    }
  }, [values, correctAnswers, currentQuestion?.id])

  const handleNext = useCallback(() => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex((i) => i + 1)
    }
  }, [currentIndex, questions.length])

  if (loading) {
    return (
      <div className="text-muted-foreground">Loading questions...</div>
    )
  }

  if (error) {
    return (
      <div className="space-y-4">
        <div className="text-destructive">Error: {error}</div>
        <Link to="/">
          <Button variant="outline">Back to Sets</Button>
        </Link>
      </div>
    )
  }

  if (questions.length === 0) {
    return (
      <div className="space-y-4">
        <div className="text-muted-foreground">No questions in this set.</div>
        <Link to="/">
          <Button variant="outline">Back to Sets</Button>
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Link to="/">
          <Button variant="ghost" size="sm">
            ← Back
          </Button>
        </Link>
        <span className="text-sm text-muted-foreground">
          Question {currentIndex + 1} of {questions.length}
        </span>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base font-medium">
            {currentQuestion.question}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <FillInBlank
            tokens={tokens}
            values={values}
            onChange={handleChange}
            disabled={submitted}
            results={results?.blanks}
          />

          <div className="flex items-center gap-2 pt-2">
            {!submitted ? (
              <Button onClick={handleSubmit}>Check Answer</Button>
            ) : (
              <>
                {results && (
                  <div className="flex-1 text-sm font-medium">
                    Score: {results.correctCount} of {results.totalBlanks} correct
                    <span className="ml-1 text-muted-foreground">
                      ({Math.round(results.score * 100)}%)
                    </span>
                  </div>
                )}
                {currentIndex < questions.length - 1 && (
                  <Button onClick={handleNext}>Next →</Button>
                )}
              </>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

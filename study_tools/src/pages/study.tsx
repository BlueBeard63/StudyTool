import { useCallback, useEffect, useMemo, useState } from "react"
import { Link, useNavigate, useParams } from "react-router"

import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { FillInBlank } from "@/components/fill-in-blank"
import { ScoreDot } from "@/components/score-dot"
import { SessionSummary } from "@/components/session-summary"
import {
  fetchQuestions,
  fetchQuestionStats,
  fetchSet,
  recordAttempt,
  type Question,
  type QuestionSet,
} from "@/lib/api"
import { countBlanks, getCorrectAnswers, tokenizeAndBlank } from "@/lib/blanking"
import { checkAnswers, type CheckResult } from "@/lib/checking"
import {
  createInitialSession,
  type QuestionResult,
  type SessionState,
} from "@/lib/session"
import { cn } from "@/lib/utils"

export function StudyPage() {
  const { setId } = useParams<{ setId: string }>()
  const navigate = useNavigate()

  // Data state
  const [questionSet, setQuestionSet] = useState<QuestionSet | null>(null)
  const [questions, setQuestions] = useState<Question[]>([])
  const [scores, setScores] = useState<Record<string, number | null>>({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Session state
  const [session, setSession] = useState<SessionState>(createInitialSession)

  // Per-question UI state
  const [values, setValues] = useState<string[]>([])
  const [submitted, setSubmitted] = useState(false)
  const [results, setResults] = useState<CheckResult | null>(null)

  // Derived state
  const currentQuestion = questions[session.currentIndex]

  const tokens = useMemo(() => {
    if (!currentQuestion) return []
    return tokenizeAndBlank(currentQuestion.answer)
  }, [currentQuestion])

  const correctAnswers = useMemo(() => getCorrectAnswers(tokens), [tokens])

  // Fetch set and questions on mount
  useEffect(() => {
    if (!setId) return

    Promise.all([fetchSet(setId), fetchQuestions(setId)])
      .then(async ([set, qs]) => {
        setQuestionSet(set)
        setQuestions(qs)

        // Fetch scores for all questions in parallel
        const statsPromises = qs.map((q) =>
          fetchQuestionStats(q.id).catch(() => null)
        )
        const statsResults = await Promise.all(statsPromises)

        const scoreMap: Record<string, number | null> = {}
        qs.forEach((q, i) => {
          scoreMap[q.id] = statsResults[i]?.score ?? null
        })
        setScores(scoreMap)
        setLoading(false)
      })
      .catch((e) => {
        setError(e.message)
        setLoading(false)
      })
  }, [setId])

  // Reset question UI state when question changes
  useEffect(() => {
    const numBlanks = countBlanks(tokens)
    setValues(new Array(numBlanks).fill(""))
    setSubmitted(false)
    setResults(null)
  }, [tokens])

  const handleStart = useCallback(() => {
    setSession((prev) => ({ ...prev, status: "in-progress" }))
  }, [])

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

    const isCorrect = checkResult.score >= 0.5

    // Record to session
    const questionResult: QuestionResult = {
      questionId: currentQuestion.id,
      question: currentQuestion.question,
      correct: isCorrect,
      score: checkResult.score,
      userAnswers: values,
      correctAnswers,
    }

    setSession((prev) => {
      const newResults = [...prev.results, questionResult]
      const newCorrectCount = prev.correctCount + (isCorrect ? 1 : 0)
      const newTotal =
        newResults.reduce((sum, r) => sum + r.score, 0) / newResults.length

      return {
        ...prev,
        questionsAnswered: prev.questionsAnswered + 1,
        correctCount: newCorrectCount,
        totalScore: newTotal,
        results: newResults,
      }
    })

    // Record to backend
    try {
      await recordAttempt(currentQuestion.id, isCorrect)
      const stats = await fetchQuestionStats(currentQuestion.id)
      setScores((prev) => ({ ...prev, [currentQuestion.id]: stats.score }))
    } catch (e) {
      console.error("Failed to record attempt:", e)
    }
  }, [values, correctAnswers, currentQuestion])

  const handleNext = useCallback(() => {
    if (session.currentIndex < questions.length - 1) {
      setSession((prev) => ({ ...prev, currentIndex: prev.currentIndex + 1 }))
    } else {
      setSession((prev) => ({ ...prev, status: "completed" }))
    }
  }, [session.currentIndex, questions.length])

  const handleRetry = useCallback(() => {
    setSession(createInitialSession())
  }, [])

  const handleBack = useCallback(() => {
    navigate("/")
  }, [navigate])

  // Loading state
  if (loading) {
    return <div className="text-muted-foreground">Loading questions...</div>
  }

  // Error state
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

  // Empty set
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

  // Session not started - show start screen
  if (session.status === "not-started") {
    return (
      <div className="space-y-6">
        <Link to="/">
          <Button variant="ghost" size="sm">
            ← Back
          </Button>
        </Link>

        <Card>
          <CardHeader>
            <CardTitle>{questionSet?.name ?? "Study Set"}</CardTitle>
            <CardDescription>{questions.length} questions</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={handleStart} size="lg">
              Start Studying
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Session completed - show summary
  if (session.status === "completed") {
    return (
      <div className="space-y-6">
        <SessionSummary
          session={session}
          setName={questionSet?.name ?? "Study Set"}
          onRetry={handleRetry}
          onBack={handleBack}
        />
      </div>
    )
  }

  // Session in progress - show question
  const isLastQuestion = session.currentIndex >= questions.length - 1

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Link to="/">
          <Button variant="ghost" size="sm">
            ← Back
          </Button>
        </Link>
        <div className="flex items-center gap-1.5">
          {questions.map((q, i) => (
            <div
              key={q.id}
              className={cn(
                "rounded-full p-0.5",
                i === session.currentIndex &&
                  "ring-2 ring-primary ring-offset-2",
                i < session.questionsAnswered && "opacity-50"
              )}
            >
              <ScoreDot score={scores[q.id] ?? null} size="md" />
            </div>
          ))}
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-base font-medium">
              {currentQuestion.question}
            </CardTitle>
            <span className="text-sm text-muted-foreground">
              {session.currentIndex + 1} / {questions.length}
            </span>
          </div>
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
                    Score: {results.correctCount} of {results.totalBlanks}{" "}
                    correct
                    <span className="ml-1 text-muted-foreground">
                      ({Math.round(results.score * 100)}%)
                    </span>
                  </div>
                )}
                <Button onClick={handleNext}>
                  {isLastQuestion ? "Finish" : "Next →"}
                </Button>
              </>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

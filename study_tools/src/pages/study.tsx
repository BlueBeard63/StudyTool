import { useCallback, useEffect, useMemo, useRef, useState } from "react"
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
import { TimerDisplay } from "@/components/timer-display"
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
import { createSmartOrder, pickNextIndex } from "@/lib/ordering"
import {
  createInitialSession,
  type QuestionResult,
  type SessionMode,
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

  // Mode selection state (before session starts)
  const [selectedMode, setSelectedMode] = useState<SessionMode>("practice")
  const [selectedDuration, setSelectedDuration] = useState<number>(60)

  // Session state
  const [session, setSession] = useState<SessionState>(createInitialSession)

  // Per-question UI state
  const [values, setValues] = useState<string[]>([])
  const [submitted, setSubmitted] = useState(false)
  const [results, setResults] = useState<CheckResult | null>(null)

  // Timed mode: auto-advance countdown after submit
  const [reviewCountdown, setReviewCountdown] = useState<number | null>(null)
  const reviewTimerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // Derived state: use smart order for practice mode
  const currentQuestion = useMemo(() => {
    if (session.mode === "practice" && session.questionOrder.length > 0) {
      const questionIndex = session.questionOrder[session.currentIndex]
      return questions[questionIndex]
    }
    return questions[session.currentIndex]
  }, [questions, session.currentIndex, session.mode, session.questionOrder])

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
    setReviewCountdown(null)
  }, [tokens])

  // Timer countdown for timed mode
  useEffect(() => {
    if (session.status !== "in-progress" || session.mode !== "timed") return
    if (session.timeRemaining === null || session.timeRemaining <= 0) return

    const interval = setInterval(() => {
      setSession((prev) => {
        if (prev.timeRemaining === null) return prev
        const newTime = prev.timeRemaining - 1
        if (newTime <= 0) {
          return { ...prev, status: "completed", timeRemaining: 0 }
        }
        return { ...prev, timeRemaining: newTime }
      })
    }, 1000)

    return () => clearInterval(interval)
  }, [session.status, session.mode, session.timeRemaining])

  // Review countdown for timed mode (auto-advance after showing results)
  useEffect(() => {
    if (reviewCountdown === null) return

    if (reviewCountdown <= 0) {
      // Auto-advance to next question using smart selection
      setSession((prev) => {
        const scoreArray = questions.map((q) => scores[q.id])
        const nextIndex = pickNextIndex(scoreArray, prev.recentIndices)
        return {
          ...prev,
          currentIndex: nextIndex,
          recentIndices: [...prev.recentIndices, nextIndex],
        }
      })
      setReviewCountdown(null)
      return
    }

    reviewTimerRef.current = setInterval(() => {
      setReviewCountdown((prev) => (prev !== null ? prev - 1 : null))
    }, 1000)

    return () => {
      if (reviewTimerRef.current) clearInterval(reviewTimerRef.current)
    }
  }, [reviewCountdown, questions, scores])

  const handleStart = useCallback(() => {
    const duration = selectedMode === "timed" ? selectedDuration : null

    // Compute smart question order for practice mode
    const scoreArray = questions.map((q) => scores[q.id])
    const questionOrder =
      selectedMode === "practice" ? createSmartOrder(scoreArray) : []

    // For timed mode, pick first question using smart selection
    const firstIndex =
      selectedMode === "timed" ? pickNextIndex(scoreArray, []) : 0

    setSession({
      ...createInitialSession(selectedMode, duration),
      status: "in-progress",
      startTime: Date.now(),
      questionOrder,
      currentIndex: firstIndex,
      recentIndices: selectedMode === "timed" ? [firstIndex] : [],
    })
  }, [selectedMode, selectedDuration, questions, scores])

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

    // In timed mode, start review countdown then auto-advance
    if (session.mode === "timed") {
      // 30s if any wrong, 15s if all correct
      const hasWrong = checkResult.blanks.some((b) => !b.isCorrect)
      setReviewCountdown(hasWrong ? 30 : 15)
    }

    // Record to backend
    try {
      await recordAttempt(currentQuestion.id, isCorrect)
      if (session.mode === "practice") {
        const stats = await fetchQuestionStats(currentQuestion.id)
        setScores((prev) => ({ ...prev, [currentQuestion.id]: stats.score }))
      }
    } catch (e) {
      console.error("Failed to record attempt:", e)
    }
  }, [values, correctAnswers, currentQuestion, session.mode])

  const handleNext = useCallback(() => {
    if (session.currentIndex < questions.length - 1) {
      setSession((prev) => ({ ...prev, currentIndex: prev.currentIndex + 1 }))
    } else {
      setSession((prev) => ({ ...prev, status: "completed" }))
    }
  }, [session.currentIndex, questions.length])

  const handleSkipReview = useCallback(() => {
    // Skip the review countdown in timed mode
    setReviewCountdown(null)
    setSession((prev) => {
      const scoreArray = questions.map((q) => scores[q.id])
      const nextIndex = pickNextIndex(scoreArray, prev.recentIndices)
      return {
        ...prev,
        currentIndex: nextIndex,
        recentIndices: [...prev.recentIndices, nextIndex],
      }
    })
  }, [questions, scores])

  const handleRetry = useCallback(() => {
    setSession(createInitialSession(selectedMode, selectedMode === "timed" ? selectedDuration : null))
  }, [selectedMode, selectedDuration])

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

  // Session not started - show start screen with mode selection
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
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <Button
                variant={selectedMode === "practice" ? "default" : "outline"}
                onClick={() => setSelectedMode("practice")}
              >
                Practice
              </Button>
              <Button
                variant={selectedMode === "timed" ? "default" : "outline"}
                onClick={() => setSelectedMode("timed")}
              >
                Timed
              </Button>
            </div>

            {selectedMode === "timed" && (
              <div className="flex gap-2">
                {[60, 180, 300].map((duration) => (
                  <Button
                    key={duration}
                    variant={selectedDuration === duration ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSelectedDuration(duration)}
                  >
                    {duration / 60} min
                  </Button>
                ))}
              </div>
            )}

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

        {session.mode === "timed" && session.timeRemaining !== null ? (
          <TimerDisplay timeRemaining={session.timeRemaining} />
        ) : (
          <div className="flex items-center gap-1.5">
            {questions.map((q, i) => {
              // Find if this question is currently being shown
              const isCurrentQuestion =
                session.questionOrder.length > 0
                  ? session.questionOrder[session.currentIndex] === i
                  : session.currentIndex === i

              // Check if already answered in this session
              const isAnswered = session.results.some(
                (r) => r.questionId === q.id
              )

              return (
                <div
                  key={q.id}
                  className={cn(
                    "rounded-full p-0.5",
                    isCurrentQuestion && "ring-2 ring-primary ring-offset-2",
                    isAnswered && "opacity-50"
                  )}
                >
                  <ScoreDot score={scores[q.id] ?? null} size="md" />
                </div>
              )
            })}
          </div>
        )}
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-base font-medium">
              {currentQuestion.question}
            </CardTitle>
            <span className="text-sm text-muted-foreground">
              {session.mode === "timed"
                ? `#${session.questionsAnswered + 1}`
                : `${session.currentIndex + 1} / ${questions.length}`}
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
            ) : session.mode === "timed" ? (
              <>
                {results && (
                  <div className="flex-1 text-sm font-medium">
                    Score: {results.correctCount} of {results.totalBlanks}{" "}
                    correct
                    {reviewCountdown !== null && (
                      <span className="ml-2 text-muted-foreground">
                        Next in {reviewCountdown}s
                      </span>
                    )}
                  </div>
                )}
                <Button onClick={handleSkipReview} variant="outline">
                  Skip →
                </Button>
              </>
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

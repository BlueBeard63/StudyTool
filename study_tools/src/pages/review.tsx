import { useCallback, useEffect, useMemo, useState } from "react"
import { Link, useNavigate } from "react-router"
import { Star } from "lucide-react"

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
import { SessionResults } from "@/components/session-results"
import { WordBank } from "@/components/word-bank"
import { WordBankBlank } from "@/components/word-bank-blank"
import {
  fetchDueQuestions,
  fetchQuestionStats,
  recordAttempt,
  toggleQuestionBookmark,
  type Question,
} from "@/lib/api"
import { countBlanks, getCorrectAnswers, tokenizeAndBlank } from "@/lib/blanking"
import { checkAnswers, type CheckResult } from "@/lib/checking"
import {
  createInitialSession,
  DIFFICULTY_PERCENT,
  type Difficulty,
  type InputMethod,
  type QuestionResult,
  type SessionState,
} from "@/lib/session"
import { cn } from "@/lib/utils"

export function ReviewPage() {
  const navigate = useNavigate()

  // Data state
  const [questions, setQuestions] = useState<Question[]>([])
  const [scores, setScores] = useState<Record<string, number | null>>({})
  const [bookmarks, setBookmarks] = useState<Record<string, boolean>>({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Mode selection state (before session starts)
  const [selectedDifficulty, setSelectedDifficulty] = useState<Difficulty>("medium")
  const [selectedInputMethod, setSelectedInputMethod] = useState<InputMethod>("typing")
  const [selectedQuestionCount, setSelectedQuestionCount] = useState<number | null>(32)

  // Session state
  const [session, setSession] = useState<SessionState>(createInitialSession)

  // Per-question UI state
  const [values, setValues] = useState<string[]>([])
  const [submitted, setSubmitted] = useState(false)
  const [results, setResults] = useState<CheckResult | null>(null)
  const [hintsUsed, setHintsUsed] = useState(0)
  const [hintedBlanks, setHintedBlanks] = useState<Set<number>>(new Set())

  // Word bank mode state
  const [selectedWordIndex, setSelectedWordIndex] = useState<number | null>(null)
  const [wordToBlankMap, setWordToBlankMap] = useState<Map<number, number>>(new Map())

  const currentQuestion = useMemo(() => {
    return questions[session.currentIndex]
  }, [questions, session.currentIndex])

  const activeDifficulty =
    session.status === "in-progress" ? session.difficulty : selectedDifficulty

  const tokens = useMemo(() => {
    if (!currentQuestion) return []
    const percent = DIFFICULTY_PERCENT[activeDifficulty]
    return tokenizeAndBlank(currentQuestion.answer, percent)
  }, [currentQuestion, activeDifficulty])

  const correctAnswers = useMemo(() => getCorrectAnswers(tokens), [tokens])

  // Word bank: correct answers + decoys, shuffled
  const bankWords = useMemo(() => {
    const correctSet = new Set(correctAnswers.map((a) => a.toLowerCase()))
    const decoyPool: string[] = []

    for (const q of questions) {
      if (q.id === currentQuestion?.id) continue
      const words = q.answer.split(/\s+/).filter((w) => /[a-zA-Z]/.test(w))
      for (const word of words) {
        if (!correctSet.has(word.toLowerCase())) {
          decoyPool.push(word)
        }
      }
    }

    const shuffledDecoys = [...decoyPool].sort(() => Math.random() - 0.5)
    const numDecoys = Math.max(1, Math.ceil(correctAnswers.length / 2))
    const selectedDecoys = shuffledDecoys.slice(0, numDecoys)

    const allWords = [...correctAnswers, ...selectedDecoys]
    return allWords.sort(() => Math.random() - 0.5)
  }, [correctAnswers, questions, currentQuestion?.id])

  const usedWordIndices = useMemo(() => {
    const used = new Set<number>()
    wordToBlankMap.forEach((_, wordIndex) => used.add(wordIndex))
    return used
  }, [wordToBlankMap])

  // Fetch due questions on mount
  useEffect(() => {
    fetchDueQuestions()
      .then((dueQuestions) => {
        setQuestions(dueQuestions)
        const bookmarkMap: Record<string, boolean> = {}
        dueQuestions.forEach((q) => {
          bookmarkMap[q.id] = q.bookmarked ?? false
        })
        setBookmarks(bookmarkMap)
        setLoading(false)
      })
      .catch((e) => {
        setError(e.message)
        setLoading(false)
      })
  }, [])

  // Reset question UI state when question changes
  useEffect(() => {
    const numBlanks = countBlanks(tokens)
    setValues(new Array(numBlanks).fill(""))
    setSubmitted(false)
    setResults(null)
    setHintsUsed(0)
    setHintedBlanks(new Set())
    setSelectedWordIndex(null)
    setWordToBlankMap(new Map())
  }, [tokens])

  const handleStart = useCallback(() => {
    setSession({
      ...createInitialSession("practice", null, selectedDifficulty, selectedInputMethod),
      status: "in-progress",
      startTime: Date.now(),
      currentIndex: 0,
    })
  }, [selectedDifficulty, selectedInputMethod])

  const handleChange = useCallback((blankIndex: number, value: string) => {
    setValues((prev) => {
      const next = [...prev]
      next[blankIndex] = value
      return next
    })
  }, [])

  const handleBlankClick = useCallback(
    (blankIndex: number) => {
      if (selectedWordIndex === null) return

      setValues((prev) => {
        const next = [...prev]
        next[blankIndex] = bankWords[selectedWordIndex]
        return next
      })

      setWordToBlankMap((prev) => {
        const next = new Map(prev)
        next.set(selectedWordIndex, blankIndex)
        return next
      })

      setSelectedWordIndex(null)
    },
    [selectedWordIndex, bankWords]
  )

  const handlePlacedWordClick = useCallback((blankIndex: number) => {
    let wordIndex: number | null = null
    wordToBlankMap.forEach((bIdx, wIdx) => {
      if (bIdx === blankIndex) wordIndex = wIdx
    })

    if (wordIndex === null) return

    setValues((prev) => {
      const next = [...prev]
      next[blankIndex] = ""
      return next
    })

    setWordToBlankMap((prev) => {
      const next = new Map(prev)
      next.delete(wordIndex!)
      return next
    })
  }, [wordToBlankMap])

  const handleHint = useCallback(() => {
    const emptyBlanks = values
      .map((v, i) => ({ value: v, index: i }))
      .filter((b) => !b.value.trim() && !hintedBlanks.has(b.index))

    if (emptyBlanks.length === 0) return

    const randomBlank =
      emptyBlanks[Math.floor(Math.random() * emptyBlanks.length)]

    setValues((prev) => {
      const next = [...prev]
      next[randomBlank.index] = correctAnswers[randomBlank.index]
      return next
    })

    setHintsUsed((prev) => prev + 1)
    setHintedBlanks((prev) => new Set([...prev, randomBlank.index]))
  }, [values, correctAnswers, hintedBlanks])

  const handleSubmit = useCallback(async () => {
    const checkResult = checkAnswers(values, correctAnswers)
    setResults(checkResult)
    setSubmitted(true)

    const isCorrect = checkResult.score >= 0.5

    const questionResult: QuestionResult = {
      questionId: currentQuestion.id,
      question: currentQuestion.question,
      correct: isCorrect,
      score: checkResult.score,
      userAnswers: values,
      correctAnswers,
      hintsUsed,
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

    try {
      await recordAttempt(currentQuestion.id, isCorrect, checkResult.score)
      const stats = await fetchQuestionStats(currentQuestion.id)
      setScores((prev) => ({ ...prev, [currentQuestion.id]: stats.score }))
    } catch (e) {
      console.error("Failed to record attempt:", e)
    }
  }, [values, correctAnswers, currentQuestion, hintsUsed])

  const handleNext = useCallback(() => {
    const effectiveCount = Math.min(
      selectedQuestionCount ?? questions.length,
      questions.length
    )
    if (session.currentIndex < effectiveCount - 1) {
      setSession((prev) => ({ ...prev, currentIndex: prev.currentIndex + 1 }))
    } else {
      setSession((prev) => ({ ...prev, status: "completed" }))
    }
  }, [session.currentIndex, questions.length, selectedQuestionCount])

  const handleRetry = useCallback(() => {
    setSession(createInitialSession("practice", null, selectedDifficulty, selectedInputMethod))
  }, [selectedDifficulty, selectedInputMethod])

  const handleBack = useCallback(() => {
    navigate("/")
  }, [navigate])

  const handleToggleBookmark = useCallback(async (questionId?: string) => {
    const targetId = questionId ?? currentQuestion?.id
    if (!targetId) return
    const newBookmarked = !bookmarks[targetId]

    setBookmarks((prev) => ({ ...prev, [targetId]: newBookmarked }))

    try {
      await toggleQuestionBookmark(targetId, newBookmarked)
    } catch (e) {
      setBookmarks((prev) => ({ ...prev, [targetId]: !newBookmarked }))
      console.error("Failed to toggle bookmark:", e)
    }
  }, [currentQuestion, bookmarks])

  // Loading state
  if (loading) {
    return <div className="text-muted-foreground">Loading due questions...</div>
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

  // No questions due
  if (questions.length === 0) {
    return (
      <div className="space-y-4">
        <Link to="/">
          <Button variant="ghost" size="sm">
            ← Back
          </Button>
        </Link>
        <Card>
          <CardHeader>
            <CardTitle>No Questions Due</CardTitle>
            <CardDescription>
              You're all caught up! No questions are due for review right now.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Keep studying to build your spaced repetition queue.
            </p>
          </CardContent>
        </Card>
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
            <CardTitle>Spaced Repetition Review</CardTitle>
            <CardDescription>
              {questions.length} question{questions.length !== 1 ? "s" : ""} due for review
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Difficulty</p>
              <div className="flex gap-2">
                {(["easy", "medium", "hard", "extreme"] as const).map((diff) => (
                  <Button
                    key={diff}
                    variant={selectedDifficulty === diff ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSelectedDifficulty(diff)}
                  >
                    {diff.charAt(0).toUpperCase() + diff.slice(1)}
                  </Button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Input Method</p>
              <div className="flex gap-2">
                <Button
                  variant={selectedInputMethod === "typing" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedInputMethod("typing")}
                >
                  Typing
                </Button>
                <Button
                  variant={selectedInputMethod === "wordbank" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedInputMethod("wordbank")}
                >
                  Word Bank
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Questions</p>
              <div className="flex gap-2">
                {[16, 32, 64, null].map((count) => (
                  <Button
                    key={count ?? "all"}
                    variant={selectedQuestionCount === count ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSelectedQuestionCount(count)}
                  >
                    {count ?? "All"}
                  </Button>
                ))}
              </div>
            </div>

            <Button onClick={handleStart} size="lg">
              Start Review
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Session completed - show results
  if (session.status === "completed") {
    return (
      <div className="space-y-6">
        <SessionResults
          results={session.results}
          bookmarks={bookmarks}
          onToggleBookmark={handleToggleBookmark}
          mode="practice"
          timerDuration={null}
          startTime={session.startTime}
          setName="Spaced Repetition Review"
          onRetry={handleRetry}
          onBack={handleBack}
          showSRFeedback
        />
      </div>
    )
  }

  // Session in progress - show question
  const effectiveQuestionCount = Math.min(
    selectedQuestionCount ?? questions.length,
    questions.length
  )
  const isLastQuestion = session.currentIndex >= effectiveQuestionCount - 1

  // Format next review date for display
  const formatNextReview = (nextReview: string | null | undefined): string => {
    if (!nextReview) return "New"
    const reviewDate = new Date(nextReview)
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    reviewDate.setHours(0, 0, 0, 0)

    const diffDays = Math.floor((reviewDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))

    if (diffDays < 0) return "Overdue"
    if (diffDays === 0) return "Due today"
    return `Due in ${diffDays} day${diffDays !== 1 ? "s" : ""}`
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Link to="/">
          <Button variant="ghost" size="sm">
            ← Back
          </Button>
        </Link>

        <div className="flex items-center gap-1.5">
          {questions.slice(0, effectiveQuestionCount).map((q, i) => {
            const isCurrentQuestion = session.currentIndex === i
            const isAnswered = session.results.some((r) => r.questionId === q.id)

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
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <CardTitle className="text-base font-medium">
                {currentQuestion.question}
              </CardTitle>
              <CardDescription className="mt-1">
                {formatNextReview(currentQuestion.nextReview)}
                {currentQuestion.repetitions ? ` · ${currentQuestion.repetitions} rep${currentQuestion.repetitions !== 1 ? "s" : ""}` : ""}
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => handleToggleBookmark()}
                className="text-muted-foreground hover:text-yellow-500 transition-colors"
                title={bookmarks[currentQuestion.id] ? "Remove bookmark" : "Bookmark question"}
              >
                <Star
                  className={cn(
                    "h-5 w-5",
                    bookmarks[currentQuestion.id] && "fill-yellow-500 text-yellow-500"
                  )}
                />
              </button>
              <span className="text-sm text-muted-foreground">
                {session.currentIndex + 1} / {effectiveQuestionCount}
              </span>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {session.inputMethod === "wordbank" ? (
            <WordBankBlank
              tokens={tokens}
              values={values}
              selectedWordIndex={selectedWordIndex}
              onBlankClick={handleBlankClick}
              onPlacedWordClick={handlePlacedWordClick}
              disabled={submitted}
              results={results?.blanks}
            />
          ) : (
            <FillInBlank
              tokens={tokens}
              values={values}
              onChange={handleChange}
              disabled={submitted}
              results={results?.blanks}
            />
          )}

          {session.inputMethod === "wordbank" && !submitted && (
            <WordBank
              words={bankWords}
              usedIndices={usedWordIndices}
              selectedIndex={selectedWordIndex}
              onSelect={setSelectedWordIndex}
              disabled={submitted}
            />
          )}

          <div className="flex flex-col gap-2 pt-2">
            {!submitted ? (
              <>
                <div className="flex items-center gap-2">
                  {session.inputMethod !== "wordbank" && (
                    <Button
                      onClick={handleHint}
                      variant="outline"
                      disabled={values.every((v, i) => v.trim() || hintedBlanks.has(i))}
                    >
                      Hint
                    </Button>
                  )}
                  <Button onClick={handleSubmit}>Check Answers</Button>
                  <span className="text-sm text-muted-foreground">
                    {values.filter((v) => v.trim()).length} / {values.length} filled
                  </span>
                </div>
                {values.some((v) => v.trim()) && values.some((v) => !v.trim()) && (
                  <p className="text-xs text-muted-foreground">
                    You can submit with empty blanks
                  </p>
                )}
              </>
            ) : (
              <>
                {results && (
                  <div className="flex-1 text-sm font-medium">
                    Score: {results.correctCount} of {results.totalBlanks} correct
                    <span className="ml-1 text-muted-foreground">
                      ({Math.round(results.score * 100)}%)
                    </span>
                    {hintsUsed > 0 && (
                      <span className="ml-2 text-muted-foreground">
                        ({hintsUsed} hint{hintsUsed !== 1 ? "s" : ""} used)
                      </span>
                    )}
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

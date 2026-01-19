import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { Link, useNavigate, useParams } from "react-router"
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
import { TimerDisplay } from "@/components/timer-display"
import { WordBank } from "@/components/word-bank"
import { WordBankBlank } from "@/components/word-bank-blank"
import {
  fetchQuestionStats,
  fetchSet,
  fetchStudyQuestions,
  recordAttempt,
  toggleQuestionBookmark,
  type QuestionSet,
  type QuestionWithScore,
} from "@/lib/api"
import { countBlanks, getCorrectAnswers, tokenizeAndBlank } from "@/lib/blanking"
import { checkAnswers, type CheckResult } from "@/lib/checking"
import { pickNextIndex } from "@/lib/ordering"
import {
  createInitialSession,
  DIFFICULTY_PERCENT,
  type Difficulty,
  type InputMethod,
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
  const [questions, setQuestions] = useState<QuestionWithScore[]>([])
  const [scores, setScores] = useState<Record<string, number | null>>({})
  const [bookmarks, setBookmarks] = useState<Record<string, boolean>>({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Mode selection state (before session starts)
  const [selectedMode, setSelectedMode] = useState<SessionMode>("practice")
  const [selectedDuration, setSelectedDuration] = useState<number>(60)
  const [selectedDifficulty, setSelectedDifficulty] = useState<Difficulty>("medium")
  const [selectedInputMethod, setSelectedInputMethod] = useState<InputMethod>("typing")
  const [selectedQuestionCount, setSelectedQuestionCount] = useState<number | null>(32) // null = All
  const [selectedBookmarkedOnly, setSelectedBookmarkedOnly] = useState(false)
  const [showCustomInput, setShowCustomInput] = useState(false)
  const [customMinutes, setCustomMinutes] = useState<string>("")

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
  const [wordToBlankMap, setWordToBlankMap] = useState<Map<number, number>>(new Map()) // wordIndex -> blankIndex

  // Timed mode: auto-advance countdown after submit
  const [reviewCountdown, setReviewCountdown] = useState<number | null>(null)
  const reviewTimerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // Derived state: questions are already smart-ordered from backend
  const currentQuestion = useMemo(() => {
    return questions[session.currentIndex]
  }, [questions, session.currentIndex])

  // Use session difficulty when in progress, otherwise use selected difficulty
  const activeDifficulty =
    session.status === "in-progress" ? session.difficulty : selectedDifficulty

  const tokens = useMemo(() => {
    if (!currentQuestion) return []
    const percent = DIFFICULTY_PERCENT[activeDifficulty]
    return tokenizeAndBlank(currentQuestion.answer, percent)
  }, [currentQuestion, activeDifficulty])

  const correctAnswers = useMemo(() => getCorrectAnswers(tokens), [tokens])

  // Word bank: correct answers + decoys from other questions, shuffled
  const bankWords = useMemo(() => {
    // Build pool of decoy words from all OTHER answers in the set
    const correctSet = new Set(correctAnswers.map((a) => a.toLowerCase()))
    const decoyPool: string[] = []

    for (const q of questions) {
      if (q.id === currentQuestion?.id) continue // Skip current question
      // Extract words from this answer
      const words = q.answer.split(/\s+/).filter((w) => /[a-zA-Z]/.test(w))
      for (const word of words) {
        // Only add if not a correct answer for current question
        if (!correctSet.has(word.toLowerCase())) {
          decoyPool.push(word)
        }
      }
    }

    // Shuffle and select decoys (roughly half as many as correct answers)
    const shuffledDecoys = [...decoyPool].sort(() => Math.random() - 0.5)
    const numDecoys = Math.max(1, Math.ceil(correctAnswers.length / 2))
    const selectedDecoys = shuffledDecoys.slice(0, numDecoys)

    // Combine correct answers and decoys, then shuffle
    const allWords = [...correctAnswers, ...selectedDecoys]
    return allWords.sort(() => Math.random() - 0.5)
  }, [correctAnswers, questions, currentQuestion?.id])

  // Track which word bank indices have been used
  const usedWordIndices = useMemo(() => {
    const used = new Set<number>()
    wordToBlankMap.forEach((_, wordIndex) => used.add(wordIndex))
    return used
  }, [wordToBlankMap])

  // Count bookmarked questions
  const bookmarkedCount = useMemo(() => {
    return questions.filter((q) => q.bookmarked).length
  }, [questions])

  // Fetch set and questions on mount
  // Uses the study endpoint which returns questions in smart order with scores
  useEffect(() => {
    if (!setId) return

    Promise.all([fetchSet(setId), fetchStudyQuestions(setId)])
      .then(([set, questionsWithScores]) => {
        setQuestionSet(set)
        setQuestions(questionsWithScores)

        // Extract scores and bookmarks from response
        const scoreMap: Record<string, number | null> = {}
        const bookmarkMap: Record<string, boolean> = {}
        questionsWithScores.forEach((q) => {
          scoreMap[q.id] = q.score
          bookmarkMap[q.id] = q.bookmarked ?? false
        })
        setScores(scoreMap)
        setBookmarks(bookmarkMap)
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
    setHintsUsed(0)
    setHintedBlanks(new Set())
    // Reset word bank state
    setSelectedWordIndex(null)
    setWordToBlankMap(new Map())
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

    // Filter to bookmarked only if selected
    const activeQuestions = selectedBookmarkedOnly
      ? questions.filter((q) => q.bookmarked)
      : questions

    // Update questions to the filtered set
    if (selectedBookmarkedOnly) {
      setQuestions(activeQuestions)
    }

    // Questions are already in smart order from backend
    // For practice mode: use sequential indices (0, 1, 2, ...)
    // For timed mode: pick first using weighted random, track recent to avoid repeats
    const scoreArray = activeQuestions.map((q) => scores[q.id])
    const firstIndex =
      selectedMode === "timed" ? pickNextIndex(scoreArray, []) : 0

    setSession({
      ...createInitialSession(selectedMode, duration, selectedDifficulty, selectedInputMethod),
      status: "in-progress",
      startTime: Date.now(),
      questionOrder: [], // Not needed - questions already smart-ordered
      currentIndex: firstIndex,
      recentIndices: selectedMode === "timed" ? [firstIndex] : [],
    })
  }, [selectedMode, selectedDuration, selectedDifficulty, selectedInputMethod, questions, scores, selectedBookmarkedOnly])

  const handleChange = useCallback((blankIndex: number, value: string) => {
    setValues((prev) => {
      const next = [...prev]
      next[blankIndex] = value
      return next
    })
  }, [])

  // Word bank: handle clicking an empty blank to place selected word
  const handleBlankClick = useCallback(
    (blankIndex: number) => {
      if (selectedWordIndex === null) return

      // Place word in blank
      setValues((prev) => {
        const next = [...prev]
        next[blankIndex] = bankWords[selectedWordIndex]
        return next
      })

      // Track which word is in which blank
      setWordToBlankMap((prev) => {
        const next = new Map(prev)
        next.set(selectedWordIndex, blankIndex)
        return next
      })

      // Deselect word
      setSelectedWordIndex(null)
    },
    [selectedWordIndex, bankWords]
  )

  // Word bank: handle clicking a placed word to return it to bank
  const handlePlacedWordClick = useCallback((blankIndex: number) => {
    // Find which word is in this blank
    let wordIndex: number | null = null
    wordToBlankMap.forEach((bIdx, wIdx) => {
      if (bIdx === blankIndex) wordIndex = wIdx
    })

    if (wordIndex === null) return

    // Clear the blank
    setValues((prev) => {
      const next = [...prev]
      next[blankIndex] = ""
      return next
    })

    // Remove from mapping
    setWordToBlankMap((prev) => {
      const next = new Map(prev)
      next.delete(wordIndex!)
      return next
    })
  }, [wordToBlankMap])

  const handleHint = useCallback(() => {
    // Find empty blanks that haven't been hinted
    const emptyBlanks = values
      .map((v, i) => ({ value: v, index: i }))
      .filter((b) => !b.value.trim() && !hintedBlanks.has(b.index))

    if (emptyBlanks.length === 0) return

    // Pick random empty blank
    const randomBlank =
      emptyBlanks[Math.floor(Math.random() * emptyBlanks.length)]

    // Fill with correct answer
    setValues((prev) => {
      const next = [...prev]
      next[randomBlank.index] = correctAnswers[randomBlank.index]
      return next
    })

    // Track the hint
    setHintsUsed((prev) => prev + 1)
    setHintedBlanks((prev) => new Set([...prev, randomBlank.index]))
  }, [values, correctAnswers, hintedBlanks])

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
  }, [values, correctAnswers, currentQuestion, session.mode, hintsUsed])

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
    setSession(createInitialSession(selectedMode, selectedMode === "timed" ? selectedDuration : null, selectedDifficulty, selectedInputMethod))
  }, [selectedMode, selectedDuration, selectedDifficulty, selectedInputMethod])

  const handleBack = useCallback(() => {
    navigate("/")
  }, [navigate])

  const handleToggleBookmark = useCallback(async (questionId?: string) => {
    // Use provided questionId or fall back to currentQuestion.id
    const targetId = questionId ?? currentQuestion?.id
    if (!targetId) return
    const newBookmarked = !bookmarks[targetId]

    // Optimistic update
    setBookmarks((prev) => ({ ...prev, [targetId]: newBookmarked }))

    try {
      await toggleQuestionBookmark(targetId, newBookmarked)
    } catch (e) {
      // Revert on error
      setBookmarks((prev) => ({ ...prev, [targetId]: !newBookmarked }))
      console.error("Failed to toggle bookmark:", e)
    }
  }, [currentQuestion, bookmarks])

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
              <div className="space-y-2">
                <div className="flex flex-wrap gap-2">
                  {[60, 180, 300, 600, 900].map((duration) => (
                    <Button
                      key={duration}
                      variant={selectedDuration === duration && !showCustomInput ? "default" : "outline"}
                      size="sm"
                      onClick={() => {
                        setSelectedDuration(duration)
                        setShowCustomInput(false)
                        setCustomMinutes("")
                      }}
                    >
                      {duration / 60} min
                    </Button>
                  ))}
                  <Button
                    variant={showCustomInput ? "default" : "outline"}
                    size="sm"
                    onClick={() => setShowCustomInput(true)}
                  >
                    Custom
                  </Button>
                  {showCustomInput && ![60, 180, 300, 600, 900].includes(selectedDuration) && (
                    <span className="inline-flex items-center px-2 py-1 text-sm font-medium bg-primary text-primary-foreground rounded">
                      {selectedDuration / 60} min
                    </span>
                  )}
                </div>
                {showCustomInput && (
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min="1"
                      max="120"
                      value={customMinutes}
                      onChange={(e) => setCustomMinutes(e.target.value)}
                      placeholder="Minutes (1-120)"
                      className="w-32 px-2 py-1 text-sm border rounded focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                    <Button
                      size="sm"
                      onClick={() => {
                        const mins = parseInt(customMinutes, 10)
                        if (mins >= 1 && mins <= 120) {
                          setSelectedDuration(mins * 60)
                        }
                      }}
                      disabled={!customMinutes || parseInt(customMinutes, 10) < 1 || parseInt(customMinutes, 10) > 120}
                    >
                      Set
                    </Button>
                    {customMinutes && parseInt(customMinutes, 10) >= 1 && parseInt(customMinutes, 10) <= 120 && (
                      <span className="text-sm text-muted-foreground">
                        = {parseInt(customMinutes, 10)} min
                      </span>
                    )}
                  </div>
                )}
              </div>
            )}

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

            <div className="space-y-2">
              <Button
                variant={selectedBookmarkedOnly ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedBookmarkedOnly(!selectedBookmarkedOnly)}
                disabled={bookmarkedCount === 0}
              >
                <Star
                  className={cn(
                    "h-4 w-4 mr-1",
                    selectedBookmarkedOnly && "fill-current"
                  )}
                />
                Bookmarked only ({bookmarkedCount})
              </Button>
              {bookmarkedCount === 0 && (
                <p className="text-xs text-muted-foreground">
                  No bookmarked questions. Bookmark questions during study to enable this option.
                </p>
              )}
            </div>

            <Button onClick={handleStart} size="lg">
              Start Studying
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
          mode={session.mode}
          timerDuration={session.timerDuration}
          startTime={session.startTime}
          setName={questionSet?.name ?? "Study Set"}
          onRetry={handleRetry}
          onBack={handleBack}
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
            {questions.slice(0, effectiveQuestionCount).map((q, i) => {
              // Find if this question is currently being shown
              const isCurrentQuestion = session.currentIndex === i

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
            <div className="flex items-center gap-2">
              <button
                onClick={handleToggleBookmark}
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
                {session.mode === "timed"
                  ? `#${session.questionsAnswered + 1}`
                  : `${session.currentIndex + 1} / ${effectiveQuestionCount}`}
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
                      disabled={
                        // Disable if all blanks filled or hinted
                        values.every((v, i) => v.trim() || hintedBlanks.has(i)) ||
                        // In timed mode, disable after 1 hint
                        (session.mode === "timed" && hintsUsed >= 1)
                      }
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
            ) : session.mode === "timed" ? (
              <>
                {results && (
                  <div className="flex-1 text-sm font-medium">
                    Score: {results.correctCount} of {results.totalBlanks}{" "}
                    correct
                    {hintsUsed > 0 && (
                      <span className="ml-2 text-muted-foreground">
                        ({hintsUsed} hint{hintsUsed !== 1 ? "s" : ""} used)
                      </span>
                    )}
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

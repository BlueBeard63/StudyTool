import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { Link, useNavigate, useParams } from "react-router"
import { Star } from "lucide-react"

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  addQuestion,
  deleteQuestion,
  deleteSet,
  fetchQuestionsPaginated,
  fetchQuestionStats,
  fetchSet,
  toggleQuestionBookmark,
  type Question,
  type QuestionSet,
  updateQuestion,
  updateSet,
} from "@/lib/api"
import { cn } from "@/lib/utils"

function getScoreColor(score: number | null): string {
  if (score === null) return "bg-gray-300 dark:bg-gray-600"
  if (score >= 0.7) return "bg-green-500"
  if (score >= 0.3) return "bg-orange-500"
  return "bg-red-500"
}

export function SetDetailPage() {
  const { setId } = useParams<{ setId: string }>()
  const navigate = useNavigate()

  // Set data
  const [set, setSet] = useState<QuestionSet | null>(null)
  const [questions, setQuestions] = useState<Question[]>([])
  const [scores, setScores] = useState<Record<string, number | null>>({})
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Inline edit set name
  const [editingName, setEditingName] = useState(false)
  const [editName, setEditName] = useState("")
  const nameInputRef = useRef<HTMLInputElement>(null)

  // Question dialog state
  const [questionDialogOpen, setQuestionDialogOpen] = useState(false)
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null)
  const [questionText, setQuestionText] = useState("")
  const [answerText, setAnswerText] = useState("")
  const [savingQuestion, setSavingQuestion] = useState(false)

  // Delete confirmation
  const [deleteSetOpen, setDeleteSetOpen] = useState(false)
  const [deleteQuestionId, setDeleteQuestionId] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)

  // Bookmarked filter
  const [showBookmarkedOnly, setShowBookmarkedOnly] = useState(false)

  // Infinite scroll observer ref
  const observerRef = useRef<HTMLDivElement>(null)

  // Ref to break useEffect dependency cycle for loadMore
  const loadMoreRef = useRef<() => void>(() => {})

  // Fetch scores for a list of questions
  const fetchScoresForQuestions = useCallback(async (qs: Question[]) => {
    const statsPromises = qs.map((q) =>
      fetchQuestionStats(q.id).catch(() => null)
    )
    const statsResults = await Promise.all(statsPromises)
    const scoreMap: Record<string, number | null> = {}
    qs.forEach((q, i) => {
      scoreMap[q.id] = statsResults[i]?.score ?? null
    })
    return scoreMap
  }, [])

  // Fetch initial data
  useEffect(() => {
    if (!setId) return

    Promise.all([fetchSet(setId), fetchQuestionsPaginated(setId, 0, 32)])
      .then(async ([setData, questionsData]) => {
        setSet(setData)
        setQuestions(questionsData.questions)
        setTotal(questionsData.total)

        // Fetch scores for initial questions
        const scoreMap = await fetchScoresForQuestions(questionsData.questions)
        setScores(scoreMap)
        setLoading(false)
      })
      .catch((e) => {
        setError(e.message)
        setLoading(false)
      })
  }, [setId, fetchScoresForQuestions])

  const loadMore = useCallback(async () => {
    if (!setId || loadingMore) return
    setLoadingMore(true)
    try {
      const result = await fetchQuestionsPaginated(setId, questions.length, 32)
      setQuestions((prev) => [...prev, ...result.questions])

      // Fetch scores for newly loaded questions
      const newScores = await fetchScoresForQuestions(result.questions)
      setScores((prev) => ({ ...prev, ...newScores }))
    } catch (e) {
      console.error("Failed to load more questions:", e)
    }
    setLoadingMore(false)
  }, [setId, questions.length, loadingMore, fetchScoresForQuestions])

  // Keep ref updated with latest loadMore
  loadMoreRef.current = loadMore

  // Infinite scroll
  useEffect(() => {
    if (!observerRef.current || loadingMore || questions.length >= total) return

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          loadMoreRef.current()
        }
      },
      { threshold: 0.1 }
    )

    observer.observe(observerRef.current)
    return () => observer.disconnect()
  }, [questions.length, total, loadingMore])

  // Focus name input when editing
  useEffect(() => {
    if (editingName && nameInputRef.current) {
      nameInputRef.current.focus()
      nameInputRef.current.select()
    }
  }, [editingName])

  // Inline name editing
  const handleStartEditName = useCallback(() => {
    if (set) {
      setEditName(set.name)
      setEditingName(true)
    }
  }, [set])

  const handleSaveName = useCallback(async () => {
    if (!setId || !editName.trim()) {
      setEditingName(false)
      return
    }
    try {
      const updated = await updateSet(setId, editName.trim())
      setSet(updated)
    } catch (e) {
      console.error("Failed to update set name:", e)
    }
    setEditingName(false)
  }, [setId, editName])

  const handleCancelEditName = useCallback(() => {
    setEditingName(false)
  }, [])

  // Delete set
  const handleDeleteSet = useCallback(async () => {
    if (!setId) return
    setDeleting(true)
    try {
      await deleteSet(setId)
      navigate("/")
    } catch (e) {
      console.error("Failed to delete set:", e)
      setDeleting(false)
    }
  }, [setId, navigate])

  // Question dialog handlers
  const openAddQuestion = useCallback(() => {
    setEditingQuestion(null)
    setQuestionText("")
    setAnswerText("")
    setQuestionDialogOpen(true)
  }, [])

  const openEditQuestion = useCallback((q: Question) => {
    setEditingQuestion(q)
    setQuestionText(q.question)
    setAnswerText(q.answer)
    setQuestionDialogOpen(true)
  }, [])

  const handleSaveQuestion = useCallback(async () => {
    if (!setId || !questionText.trim() || !answerText.trim()) return
    setSavingQuestion(true)
    try {
      if (editingQuestion) {
        // Update existing
        const updated = await updateQuestion(
          editingQuestion.id,
          questionText.trim(),
          answerText.trim()
        )
        setQuestions((prev) =>
          prev.map((q) => (q.id === updated.id ? updated : q))
        )
      } else {
        // Add new
        const newQ = await addQuestion(
          setId,
          questionText.trim(),
          answerText.trim()
        )
        setQuestions((prev) => [newQ, ...prev])
        setTotal((prev) => prev + 1)
        if (set) {
          setSet({ ...set, questionCount: set.questionCount + 1 })
        }
      }
      setQuestionDialogOpen(false)
    } catch (e) {
      console.error("Failed to save question:", e)
    }
    setSavingQuestion(false)
  }, [setId, editingQuestion, questionText, answerText, set])

  // Delete question
  const handleDeleteQuestion = useCallback(async () => {
    if (!deleteQuestionId) return
    setDeleting(true)
    try {
      await deleteQuestion(deleteQuestionId)
      setQuestions((prev) => prev.filter((q) => q.id !== deleteQuestionId))
      setTotal((prev) => prev - 1)
      if (set) {
        setSet({ ...set, questionCount: set.questionCount - 1 })
      }
    } catch (e) {
      console.error("Failed to delete question:", e)
    }
    setDeleting(false)
    setDeleteQuestionId(null)
  }, [deleteQuestionId, set])

  // Toggle bookmark on a question
  const handleToggleBookmark = useCallback(async (questionId: string) => {
    const question = questions.find((q) => q.id === questionId)
    if (!question) return
    const newBookmarked = !question.bookmarked

    // Optimistic update
    setQuestions((prev) =>
      prev.map((q) => (q.id === questionId ? { ...q, bookmarked: newBookmarked } : q))
    )

    try {
      await toggleQuestionBookmark(questionId, newBookmarked)
    } catch (e) {
      // Revert on error
      setQuestions((prev) =>
        prev.map((q) => (q.id === questionId ? { ...q, bookmarked: !newBookmarked } : q))
      )
      console.error("Failed to toggle bookmark:", e)
    }
  }, [questions])

  // Count of bookmarked questions
  const bookmarkedCount = useMemo(() => {
    return questions.filter((q) => q.bookmarked).length
  }, [questions])

  // Filtered questions based on bookmarked filter
  const displayedQuestions = useMemo(() => {
    if (showBookmarkedOnly) {
      return questions.filter((q) => q.bookmarked)
    }
    return questions
  }, [questions, showBookmarkedOnly])

  // Loading state
  if (loading) {
    return <div className="text-muted-foreground">Loading...</div>
  }

  // Error state
  if (error || !set) {
    return (
      <div className="space-y-4">
        <div className="text-destructive">Error: {error || "Set not found"}</div>
        <Link to="/">
          <Button variant="outline">Back to Sets</Button>
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <Link to="/">
            <Button variant="ghost" size="sm" className="mb-2">
              ← Back
            </Button>
          </Link>
          {editingName ? (
            <div className="flex items-center gap-2">
              <Input
                ref={nameInputRef}
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleSaveName()
                  if (e.key === "Escape") handleCancelEditName()
                }}
                onBlur={handleSaveName}
                className="max-w-md text-2xl font-bold"
              />
            </div>
          ) : (
            <h1
              onClick={handleStartEditName}
              className="cursor-pointer text-2xl font-bold hover:text-primary"
              title="Click to edit"
            >
              {set.name}
            </h1>
          )}
          <p className="text-muted-foreground">
            {set.questionCount} question{set.questionCount !== 1 ? "s" : ""}
          </p>
        </div>
        <div className="flex gap-2">
          <Link to={`/sets/${setId}/study`}>
            <Button>Study</Button>
          </Link>
          <Button variant="destructive" onClick={() => setDeleteSetOpen(true)}>
            Delete Set
          </Button>
        </div>
      </div>

      {/* Add Question Button and Bookmarked Filter */}
      <div className="flex items-center gap-4">
        <Button onClick={openAddQuestion}>+ Add Question</Button>
        {bookmarkedCount > 0 && (
          <Button
            variant={showBookmarkedOnly ? "default" : "outline"}
            size="sm"
            onClick={() => setShowBookmarkedOnly(!showBookmarkedOnly)}
          >
            <Star className={cn("h-4 w-4 mr-1", showBookmarkedOnly && "fill-current")} />
            Bookmarked ({bookmarkedCount})
          </Button>
        )}
      </div>

      {/* Questions List */}
      <div className="space-y-3">
        {questions.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center text-muted-foreground">
              No questions yet. Add your first question!
            </CardContent>
          </Card>
        ) : displayedQuestions.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center text-muted-foreground">
              No bookmarked questions. Click the star icon on questions to bookmark them.
            </CardContent>
          </Card>
        ) : (
          displayedQuestions.map((q) => (
            <div key={q.id} className="flex overflow-hidden rounded-lg border">
              {/* Score bar on left side */}
              <div
                className={`w-1.5 shrink-0 ${getScoreColor(scores[q.id] ?? null)}`}
              />
              <Card className="flex-1 rounded-none border-0 ring-0">
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between gap-2">
                    <CardTitle className="text-sm font-medium">
                      {q.question}
                    </CardTitle>
                    <div className="flex shrink-0 gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleToggleBookmark(q.id)}
                        title={q.bookmarked ? "Remove bookmark" : "Bookmark question"}
                      >
                        <Star
                          className={cn(
                            "h-4 w-4",
                            q.bookmarked && "fill-yellow-500 text-yellow-500"
                          )}
                        />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openEditQuestion(q)}
                      >
                        Edit
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-destructive hover:text-destructive"
                        onClick={() => setDeleteQuestionId(q.id)}
                      >
                        Delete
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-sm">{q.answer}</CardDescription>
                </CardContent>
              </Card>
            </div>
          ))
        )}

        {/* Infinite scroll sentinel */}
        {questions.length < total && (
          <div ref={observerRef} className="flex justify-center py-4">
            <Button
              variant="outline"
              onClick={() => loadMoreRef.current()}
              disabled={loadingMore}
            >
              {loadingMore ? "Loading..." : "Load More"}
            </Button>
          </div>
        )}
      </div>

      {/* Question Dialog */}
      <AlertDialog
        open={questionDialogOpen}
        onOpenChange={setQuestionDialogOpen}
      >
        <AlertDialogContent className="max-w-lg">
          <AlertDialogHeader>
            <AlertDialogTitle>
              {editingQuestion ? "Edit Question" : "Add Question"}
            </AlertDialogTitle>
          </AlertDialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="question">Question</Label>
              <Textarea
                id="question"
                value={questionText}
                onChange={(e) => setQuestionText(e.target.value)}
                placeholder="Enter the question..."
                rows={2}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="answer">Answer</Label>
              <Textarea
                id="answer"
                value={answerText}
                onChange={(e) => setAnswerText(e.target.value)}
                placeholder="Enter the answer..."
                rows={3}
              />
            </div>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={savingQuestion}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleSaveQuestion}
              disabled={
                savingQuestion || !questionText.trim() || !answerText.trim()
              }
            >
              {savingQuestion ? "Saving..." : "Save"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Set Confirmation */}
      <AlertDialog open={deleteSetOpen} onOpenChange={setDeleteSetOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Set?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete "{set.name}" and all its questions.
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              onClick={handleDeleteSet}
              disabled={deleting}
            >
              {deleting ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Question Confirmation */}
      <AlertDialog
        open={!!deleteQuestionId}
        onOpenChange={(open) => !open && setDeleteQuestionId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Question?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this question and its attempt history.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              onClick={handleDeleteQuestion}
              disabled={deleting}
            >
              {deleting ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

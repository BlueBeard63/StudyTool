import { Router, type Request, type Response } from "express"
import * as QuestionSet from "../models/question-set.js"
import * as Question from "../models/question.js"
import db from "../db/index.js"
import { applySmartOrder } from "../lib/ordering.js"

interface IdParams {
  id: string
}

const router = Router()

// GET /api/sets - List all question sets with counts
router.get("/", (_req: Request, res: Response) => {
  const sets = QuestionSet.getAll()
  const setsWithCounts = sets.map((set) => ({
    ...set,
    questionCount: QuestionSet.getQuestionCount(set.id),
  }))
  res.json(setsWithCounts)
})

// POST /api/sets - Create set with questions
router.post("/", (req: Request, res: Response) => {
  const { name, questions } = req.body

  if (!name || typeof name !== "string" || name.trim() === "") {
    res.status(400).json({ error: "name is required" })
    return
  }

  if (!Array.isArray(questions) || questions.length === 0) {
    res.status(400).json({ error: "questions array with at least 1 item is required" })
    return
  }

  for (const q of questions) {
    if (!q.question || !q.answer) {
      res.status(400).json({ error: "each question must have question and answer fields" })
      return
    }
  }

  const createSetWithQuestions = db.transaction(() => {
    const set = QuestionSet.create(name.trim())
    Question.createMany(set.id, questions)
    return {
      ...set,
      questionCount: questions.length,
    }
  })

  const result = createSetWithQuestions()
  res.status(201).json(result)
})

// GET /api/sets/:id - Get single set with metadata
router.get("/:id", (req: Request<IdParams>, res: Response) => {
  const set = QuestionSet.getById(req.params.id)
  if (!set) {
    res.status(404).json({ error: "Question set not found" })
    return
  }
  res.json({
    ...set,
    questionCount: QuestionSet.getQuestionCount(set.id),
  })
})

// PUT /api/sets/:id - Rename set
router.put("/:id", (req: Request<IdParams>, res: Response) => {
  const { name } = req.body
  if (!name || typeof name !== "string" || name.trim() === "") {
    res.status(400).json({ error: "name is required" })
    return
  }
  const updated = QuestionSet.update(req.params.id, name.trim())
  if (!updated) {
    res.status(404).json({ error: "Question set not found" })
    return
  }
  res.json({
    ...updated,
    questionCount: QuestionSet.getQuestionCount(updated.id),
  })
})

// DELETE /api/sets/:id - Delete set (cascades to questions/attempts)
router.delete("/:id", (req: Request<IdParams>, res: Response) => {
  const deleted = QuestionSet.deleteById(req.params.id)
  if (!deleted) {
    res.status(404).json({ error: "Question set not found" })
    return
  }
  res.status(204).send()
})

// GET /api/sets/:id/questions - Get questions for a set (paginated)
router.get("/:id/questions", (req: Request<IdParams>, res: Response) => {
  const set = QuestionSet.getById(req.params.id)
  if (!set) {
    res.status(404).json({ error: "Question set not found" })
    return
  }

  const offset = parseInt(req.query.offset as string) || 0
  const limit = parseInt(req.query.limit as string) || 32

  const questions = Question.getBySetIdPaginated(req.params.id, offset, limit)
  const total = Question.countBySetId(req.params.id)

  res.json({ questions, total, offset, limit })
})

// POST /api/sets/:id/questions - Add a question to a set
router.post("/:id/questions", (req: Request<IdParams>, res: Response) => {
  const { question, answer } = req.body

  if (!question || typeof question !== "string" || question.trim() === "") {
    res.status(400).json({ error: "question is required" })
    return
  }
  if (!answer || typeof answer !== "string" || answer.trim() === "") {
    res.status(400).json({ error: "answer is required" })
    return
  }

  const set = QuestionSet.getById(req.params.id)
  if (!set) {
    res.status(404).json({ error: "Question set not found" })
    return
  }

  const newQuestion = Question.create(req.params.id, question.trim(), answer.trim())
  res.status(201).json(newQuestion)
})

// GET /api/sets/:id/bookmarked - Get bookmarked questions for a set
router.get("/:id/bookmarked", (req: Request<IdParams>, res: Response) => {
  const set = QuestionSet.getById(req.params.id)
  if (!set) {
    res.status(404).json({ error: "Question set not found" })
    return
  }

  const bookmarked = Question.getBookmarkedBySetId(req.params.id)
  res.json(bookmarked)
})

// GET /api/sets/:id/study - Get questions in smart order with scores
router.get("/:id/study", (req: Request<IdParams>, res: Response) => {
  const set = QuestionSet.getById(req.params.id)
  if (!set) {
    res.status(404).json({ error: "Question set not found" })
    return
  }

  // Get questions with their scores
  const questionsWithScores = Question.getBySetIdWithScores(req.params.id)

  // Apply smart ordering (prioritizes low/null scores)
  const scores = questionsWithScores.map((q) => q.score)
  const orderedQuestions = applySmartOrder(questionsWithScores, scores)

  // Apply limit if provided
  const limit = parseInt(req.query.limit as string) || orderedQuestions.length
  const limitedQuestions = orderedQuestions.slice(0, limit)

  res.json({ questions: limitedQuestions })
})

export default router

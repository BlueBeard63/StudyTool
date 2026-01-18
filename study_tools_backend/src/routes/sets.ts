import { Router, type Request, type Response } from "express"
import * as QuestionSet from "../models/question-set.js"
import * as Question from "../models/question.js"
import db from "../db/index.js"

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

// DELETE /api/sets/:id - Delete set (cascades to questions/attempts)
router.delete("/:id", (req: Request<IdParams>, res: Response) => {
  const deleted = QuestionSet.deleteById(req.params.id)
  if (!deleted) {
    res.status(404).json({ error: "Question set not found" })
    return
  }
  res.status(204).send()
})

// GET /api/sets/:id/questions - Get all questions for a set
router.get("/:id/questions", (req: Request<IdParams>, res: Response) => {
  const set = QuestionSet.getById(req.params.id)
  if (!set) {
    res.status(404).json({ error: "Question set not found" })
    return
  }
  const questions = Question.getBySetId(req.params.id)
  res.json(questions)
})

export default router

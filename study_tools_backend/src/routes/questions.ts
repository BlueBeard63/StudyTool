import { Router, type Request, type Response } from "express"
import * as Question from "../models/question.js"
import * as Attempt from "../models/attempt.js"
import { calculateWeightedScore } from "../lib/score.js"

interface IdParams {
  id: string
}

const router = Router()

// GET /api/questions/due - Get questions due for review
router.get("/due", (req: Request, res: Response) => {
  const setId = req.query.setId as string | undefined
  const questions = Question.getDueQuestions(setId)
  res.json(questions)
})

// GET /api/questions/:id/stats - Get question stats with attempt history
router.get("/:id/stats", (req: Request<IdParams>, res: Response) => {
  const question = Question.getById(req.params.id)
  if (!question) {
    res.status(404).json({ error: "Question not found" })
    return
  }

  const allAttempts = Attempt.getAllByQuestionId(question.id)
  const recentAttempts = allAttempts.slice(0, 5)

  res.json({
    question,
    attempts: recentAttempts,
    totalAttempts: allAttempts.length,
    score: calculateWeightedScore(allAttempts),
  })
})

// PUT /api/questions/:id - Update a question
router.put("/:id", (req: Request<IdParams>, res: Response) => {
  const { question, answer } = req.body

  if (!question || typeof question !== "string" || question.trim() === "") {
    res.status(400).json({ error: "question is required" })
    return
  }
  if (!answer || typeof answer !== "string" || answer.trim() === "") {
    res.status(400).json({ error: "answer is required" })
    return
  }

  const updated = Question.update(req.params.id, question.trim(), answer.trim())
  if (!updated) {
    res.status(404).json({ error: "Question not found" })
    return
  }
  res.json(updated)
})

// DELETE /api/questions/:id - Delete a question
router.delete("/:id", (req: Request<IdParams>, res: Response) => {
  const deleted = Question.deleteById(req.params.id)
  if (!deleted) {
    res.status(404).json({ error: "Question not found" })
    return
  }
  res.status(204).send()
})

// PUT /api/questions/:id/bookmark - Toggle bookmark on a question
router.put("/:id/bookmark", (req: Request<IdParams>, res: Response) => {
  const { bookmarked } = req.body

  if (typeof bookmarked !== "boolean") {
    res.status(400).json({ error: "bookmarked (boolean) is required" })
    return
  }

  const updated = Question.toggleBookmark(req.params.id, bookmarked)
  if (!updated) {
    res.status(404).json({ error: "Question not found" })
    return
  }
  res.json(updated)
})

export default router

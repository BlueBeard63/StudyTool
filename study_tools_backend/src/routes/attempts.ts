import { Router, type Request, type Response } from "express"
import * as Attempt from "../models/attempt.js"
import * as Question from "../models/question.js"
import { processAttemptSR } from "../lib/sm2.js"

const router = Router()

// POST /api/attempts - Record a study attempt
router.post("/", (req: Request, res: Response) => {
  const { questionId, correct, score } = req.body

  if (!questionId || typeof questionId !== "string") {
    res.status(400).json({ error: "questionId is required" })
    return
  }

  if (typeof correct !== "boolean") {
    res.status(400).json({ error: "correct (boolean) is required" })
    return
  }

  const question = Question.getById(questionId)
  if (!question) {
    res.status(404).json({ error: "Question not found" })
    return
  }

  // Record the attempt
  const attempt = Attempt.create(questionId, correct)

  // Update spaced repetition data
  // Use provided score if available, otherwise derive from correct boolean
  const effectiveScore =
    typeof score === "number" ? score : correct ? 1.0 : 0

  processAttemptSR(questionId, effectiveScore)

  res.status(201).json(attempt)
})

export default router

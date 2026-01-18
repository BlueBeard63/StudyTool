import { Router, type Request, type Response } from "express"
import * as Attempt from "../models/attempt.js"
import * as Question from "../models/question.js"

const router = Router()

// POST /api/attempts - Record a study attempt
router.post("/", (req: Request, res: Response) => {
  const { questionId, correct } = req.body

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

  const attempt = Attempt.create(questionId, correct)
  res.status(201).json(attempt)
})

export default router

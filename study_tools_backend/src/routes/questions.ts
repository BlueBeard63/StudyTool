import { Router, type Request, type Response } from "express"
import * as Question from "../models/question.js"
import * as Attempt from "../models/attempt.js"
import { calculateWeightedScore } from "../lib/score.js"

interface IdParams {
  id: string
}

const router = Router()

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

export default router

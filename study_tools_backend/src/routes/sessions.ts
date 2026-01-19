import { Router, type Request, type Response } from "express"
import * as Session from "../models/session.js"
import * as QuestionSet from "../models/question-set.js"

interface IdParams {
  id: string
}

const router = Router()

// POST /api/sessions - Create a study session record
router.post("/", (req: Request, res: Response) => {
  const {
    setId,
    mode,
    difficulty,
    inputMethod,
    duration,
    startedAt,
    completedAt,
    score,
    questionsAnswered,
    correctCount,
  } = req.body

  // Validate required fields
  if (!setId || typeof setId !== "string") {
    res.status(400).json({ error: "setId is required" })
    return
  }

  if (!mode || !["practice", "timed"].includes(mode)) {
    res.status(400).json({ error: "mode must be 'practice' or 'timed'" })
    return
  }

  if (!difficulty || !["easy", "medium", "hard", "extreme"].includes(difficulty)) {
    res.status(400).json({ error: "difficulty must be 'easy', 'medium', 'hard', or 'extreme'" })
    return
  }

  if (!inputMethod || !["typing", "wordbank"].includes(inputMethod)) {
    res.status(400).json({ error: "inputMethod must be 'typing' or 'wordbank'" })
    return
  }

  if (!startedAt || typeof startedAt !== "string") {
    res.status(400).json({ error: "startedAt is required" })
    return
  }

  if (!completedAt || typeof completedAt !== "string") {
    res.status(400).json({ error: "completedAt is required" })
    return
  }

  if (typeof score !== "number") {
    res.status(400).json({ error: "score is required" })
    return
  }

  if (typeof questionsAnswered !== "number") {
    res.status(400).json({ error: "questionsAnswered is required" })
    return
  }

  if (typeof correctCount !== "number") {
    res.status(400).json({ error: "correctCount is required" })
    return
  }

  // Verify set exists
  const set = QuestionSet.getById(setId)
  if (!set) {
    res.status(404).json({ error: "Question set not found" })
    return
  }

  const session = Session.create({
    setId,
    mode,
    difficulty,
    inputMethod,
    duration: typeof duration === "number" ? duration : null,
    startedAt,
    completedAt,
    score,
    questionsAnswered,
    correctCount,
  })

  res.status(201).json(session)
})

// GET /api/sessions - List sessions
router.get("/", (req: Request, res: Response) => {
  const setId = req.query.setId as string | undefined
  const limit = parseInt(req.query.limit as string) || 50

  const sessions = setId
    ? Session.getBySetId(setId, limit)
    : Session.getAll(limit)

  res.json(sessions)
})

// GET /api/sessions/:id - Get single session
router.get("/:id", (req: Request<IdParams>, res: Response) => {
  const session = Session.getById(req.params.id)
  if (!session) {
    res.status(404).json({ error: "Session not found" })
    return
  }
  res.json(session)
})

export default router

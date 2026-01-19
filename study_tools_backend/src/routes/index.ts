import { Router } from "express"
import setsRouter from "./sets.js"
import questionsRouter from "./questions.js"
import attemptsRouter from "./attempts.js"
import statsRouter from "./stats.js"
import sessionsRouter from "./sessions.js"

const router = Router()

router.use("/sets", setsRouter)
router.use("/questions", questionsRouter)
router.use("/attempts", attemptsRouter)
router.use("/stats", statsRouter)
router.use("/sessions", sessionsRouter)

export default router

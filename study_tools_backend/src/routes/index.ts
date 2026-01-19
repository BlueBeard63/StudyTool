import { Router } from "express"
import setsRouter from "./sets.js"
import questionsRouter from "./questions.js"
import attemptsRouter from "./attempts.js"
import statsRouter from "./stats.js"

const router = Router()

router.use("/sets", setsRouter)
router.use("/questions", questionsRouter)
router.use("/attempts", attemptsRouter)
router.use("/stats", statsRouter)

export default router

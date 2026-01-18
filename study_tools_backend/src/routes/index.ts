import { Router } from "express"
import setsRouter from "./sets.js"
import questionsRouter from "./questions.js"
import attemptsRouter from "./attempts.js"

const router = Router()

router.use("/sets", setsRouter)
router.use("/questions", questionsRouter)
router.use("/attempts", attemptsRouter)

export default router

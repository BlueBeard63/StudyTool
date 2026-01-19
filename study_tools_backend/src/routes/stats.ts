import { Router, type Request, type Response } from "express"
import * as Stats from "../models/stats.js"

const router = Router()

// GET /api/stats - Get overview statistics
router.get("/", (_req: Request, res: Response) => {
  const stats = Stats.getOverviewStats()
  res.json(stats)
})

// GET /api/stats/daily - Get daily statistics
router.get("/daily", (req: Request, res: Response) => {
  const days = parseInt(req.query.days as string) || 7
  const dailyStats = Stats.getDailyStats(days)
  res.json(dailyStats)
})

export default router

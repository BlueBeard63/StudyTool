import db from "../db/index.js"

interface OverviewStats {
  total: number
  correct: number
  accuracy: number
  streak: number
  today: number
  thisWeek: number
  uniqueQuestions: number
}

interface DailyStat {
  date: string
  count: number
  correct: number
  accuracy: number
}

export function getOverviewStats(): OverviewStats {
  // Total attempts and correct count
  const totalRow = db
    .prepare(
      `SELECT COUNT(*) as total, SUM(correct) as correct FROM attempts`
    )
    .get() as { total: number; correct: number }

  const total = totalRow.total || 0
  const correct = totalRow.correct || 0
  const accuracy = total > 0 ? Math.round((correct / total) * 100) : 0

  // Unique questions answered
  const uniqueRow = db
    .prepare(`SELECT COUNT(DISTINCT question_id) as unique_questions FROM attempts`)
    .get() as { unique_questions: number }
  const uniqueQuestions = uniqueRow.unique_questions || 0

  // Today's count
  const today = getTodayCount()

  // This week's count
  const thisWeek = getWeekCount()

  // Current streak
  const streak = getCurrentStreak()

  return { total, correct, accuracy, streak, today, thisWeek, uniqueQuestions }
}

export function getDailyStats(days: number = 7): DailyStat[] {
  const rows = db
    .prepare(
      `SELECT
        DATE(timestamp) as date,
        COUNT(*) as count,
        SUM(correct) as correct
      FROM attempts
      WHERE DATE(timestamp) >= DATE('now', '-' || ? || ' days')
      GROUP BY DATE(timestamp)
      ORDER BY date ASC`
    )
    .all(days - 1) as Array<{ date: string; count: number; correct: number }>

  return rows.map((row) => ({
    date: row.date,
    count: row.count,
    correct: row.correct || 0,
    accuracy: row.count > 0 ? Math.round((row.correct / row.count) * 100) : 0,
  }))
}

export function getCurrentStreak(): number {
  // Get distinct dates with attempts, ordered descending
  const rows = db
    .prepare(
      `SELECT DISTINCT DATE(timestamp) as date
       FROM attempts
       ORDER BY date DESC`
    )
    .all() as Array<{ date: string }>

  if (rows.length === 0) return 0

  // Get today's date in YYYY-MM-DD format
  const todayRow = db.prepare(`SELECT DATE('now') as today`).get() as { today: string }
  const today = todayRow.today

  let streak = 0
  let expectedDate = today

  for (const row of rows) {
    if (row.date === expectedDate) {
      streak++
      // Calculate previous day
      const prevRow = db
        .prepare(`SELECT DATE(?, '-1 day') as prev`)
        .get(expectedDate) as { prev: string }
      expectedDate = prevRow.prev
    } else if (streak === 0 && row.date === db.prepare(`SELECT DATE('now', '-1 day') as yesterday`).get()?.yesterday) {
      // First row is yesterday (no activity today yet), start streak from yesterday
      streak = 1
      const prevRow = db
        .prepare(`SELECT DATE(?, '-1 day') as prev`)
        .get(row.date) as { prev: string }
      expectedDate = prevRow.prev
    } else {
      // Gap in dates, streak broken
      break
    }
  }

  return streak
}

export function getTodayCount(): number {
  const row = db
    .prepare(
      `SELECT COUNT(*) as count FROM attempts WHERE DATE(timestamp) = DATE('now')`
    )
    .get() as { count: number }
  return row.count || 0
}

export function getWeekCount(): number {
  const row = db
    .prepare(
      `SELECT COUNT(*) as count FROM attempts WHERE DATE(timestamp) >= DATE('now', '-6 days')`
    )
    .get() as { count: number }
  return row.count || 0
}

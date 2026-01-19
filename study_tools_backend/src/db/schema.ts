import type Database from "better-sqlite3"

export function initializeSchema(db: Database.Database): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS question_sets (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS questions (
      id TEXT PRIMARY KEY,
      set_id TEXT NOT NULL,
      question TEXT NOT NULL,
      answer TEXT NOT NULL,
      bookmarked INTEGER DEFAULT 0,
      FOREIGN KEY (set_id) REFERENCES question_sets(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS attempts (
      id TEXT PRIMARY KEY,
      question_id TEXT NOT NULL,
      correct INTEGER NOT NULL,
      timestamp TEXT NOT NULL,
      FOREIGN KEY (question_id) REFERENCES questions(id) ON DELETE CASCADE
    );

    CREATE INDEX IF NOT EXISTS idx_questions_set_id ON questions(set_id);
    CREATE INDEX IF NOT EXISTS idx_attempts_question_id ON attempts(question_id);
    CREATE INDEX IF NOT EXISTS idx_attempts_timestamp ON attempts(timestamp);
  `)

  // Migration: Add bookmarked column to existing databases
  const columnExists = db
    .prepare(
      `SELECT COUNT(*) as count FROM pragma_table_info('questions') WHERE name = 'bookmarked'`
    )
    .get() as { count: number }

  if (columnExists.count === 0) {
    db.exec(`ALTER TABLE questions ADD COLUMN bookmarked INTEGER DEFAULT 0`)
  }
}

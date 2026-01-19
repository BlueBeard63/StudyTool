import type Database from "better-sqlite3"

export function initializeSchema(db: Database.Database): void {
  // Create base tables first (without new columns that need migration)
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
      FOREIGN KEY (set_id) REFERENCES question_sets(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS attempts (
      id TEXT PRIMARY KEY,
      question_id TEXT NOT NULL,
      correct INTEGER NOT NULL,
      timestamp TEXT NOT NULL,
      FOREIGN KEY (question_id) REFERENCES questions(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS sessions (
      id TEXT PRIMARY KEY,
      set_id TEXT NOT NULL,
      mode TEXT NOT NULL,
      difficulty TEXT NOT NULL,
      input_method TEXT NOT NULL,
      duration INTEGER,
      started_at TEXT NOT NULL,
      completed_at TEXT NOT NULL,
      score REAL NOT NULL,
      questions_answered INTEGER NOT NULL,
      correct_count INTEGER NOT NULL,
      FOREIGN KEY (set_id) REFERENCES question_sets(id) ON DELETE CASCADE
    );
  `)

  // Run migrations to add new columns to existing tables
  // Migration: Add bookmarked column to questions
  const bookmarkedExists = db
    .prepare(
      `SELECT COUNT(*) as count FROM pragma_table_info('questions') WHERE name = 'bookmarked'`
    )
    .get() as { count: number }

  if (bookmarkedExists.count === 0) {
    db.exec(`ALTER TABLE questions ADD COLUMN bookmarked INTEGER DEFAULT 0`)
  }

  // Migration: Add spaced repetition columns to questions
  const easeFactorExists = db
    .prepare(
      `SELECT COUNT(*) as count FROM pragma_table_info('questions') WHERE name = 'ease_factor'`
    )
    .get() as { count: number }

  if (easeFactorExists.count === 0) {
    db.exec(`ALTER TABLE questions ADD COLUMN ease_factor REAL DEFAULT 2.5`)
    db.exec(`ALTER TABLE questions ADD COLUMN repetitions INTEGER DEFAULT 0`)
    db.exec(`ALTER TABLE questions ADD COLUMN interval_days INTEGER DEFAULT 0`)
    db.exec(`ALTER TABLE questions ADD COLUMN next_review TEXT`)
  }

  // Migration: Add session_id column to attempts
  const sessionIdExists = db
    .prepare(
      `SELECT COUNT(*) as count FROM pragma_table_info('attempts') WHERE name = 'session_id'`
    )
    .get() as { count: number }

  if (sessionIdExists.count === 0) {
    db.exec(`ALTER TABLE attempts ADD COLUMN session_id TEXT`)
  }

  // Create indexes AFTER migrations have run
  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_questions_set_id ON questions(set_id);
    CREATE INDEX IF NOT EXISTS idx_attempts_question_id ON attempts(question_id);
    CREATE INDEX IF NOT EXISTS idx_attempts_timestamp ON attempts(timestamp);
    CREATE INDEX IF NOT EXISTS idx_attempts_session_id ON attempts(session_id);
    CREATE INDEX IF NOT EXISTS idx_sessions_set_id ON sessions(set_id);
    CREATE INDEX IF NOT EXISTS idx_sessions_completed_at ON sessions(completed_at);
  `)
}

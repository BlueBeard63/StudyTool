# Phase 1: Backend Foundation

## Objective

Set up a TypeScript backend with Express, SQLite database using better-sqlite3, and core data models for question sets, questions, and attempts.

## Execution Context

```
@.planning/PROJECT.md
@.planning/ROADMAP.md
@.planning/codebase/CONVENTIONS.md
```

## Context

### Location
Backend will be created at `../study_tools_backend/` (sibling to frontend).

### Stack
- **Runtime:** Node.js with TypeScript
- **Framework:** Express
- **Database:** SQLite via better-sqlite3 (synchronous API)
- **Build:** tsx for development, esbuild for production

### Data Models

**question_sets table:**
- id: TEXT PRIMARY KEY (UUID)
- name: TEXT NOT NULL
- created_at: TEXT NOT NULL (ISO timestamp)

**questions table:**
- id: TEXT PRIMARY KEY (UUID)
- set_id: TEXT NOT NULL (FK → question_sets.id)
- question: TEXT NOT NULL
- answer: TEXT NOT NULL

**attempts table:**
- id: TEXT PRIMARY KEY (UUID)
- question_id: TEXT NOT NULL (FK → questions.id)
- correct: INTEGER NOT NULL (0/1)
- timestamp: TEXT NOT NULL (ISO timestamp)

### Conventions (matching frontend)
- File names: kebab-case (`question-sets.ts`)
- Variables/functions: camelCase
- Types/interfaces: PascalCase
- ES Modules (`"type": "module"`)
- Strict TypeScript

## Tasks

### 1. Initialize backend project
Create `../study_tools_backend/` with npm init and install dependencies.

**Commands:**
```bash
mkdir -p ../study_tools_backend
cd ../study_tools_backend
npm init -y
npm install express better-sqlite3 uuid cors
npm install -D typescript @types/node @types/express @types/better-sqlite3 @types/uuid @types/cors tsx esbuild
```

**Files to create:**
- `package.json` (modify scripts)
- `tsconfig.json`

### 2. Configure TypeScript
Create strict TypeScript configuration matching frontend patterns.

**File:** `tsconfig.json`
```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "outDir": "dist",
    "rootDir": "src",
    "noUnusedLocals": true,
    "noUnusedParameters": true
  },
  "include": ["src/**/*"]
}
```

### 3. Create project structure
Set up source directory layout.

**Structure:**
```
study_tools_backend/
├── src/
│   ├── index.ts        # Entry point, Express app
│   ├── db/
│   │   ├── index.ts    # Database connection
│   │   └── schema.ts   # Table definitions
│   ├── models/
│   │   ├── question-set.ts
│   │   ├── question.ts
│   │   └── attempt.ts
│   └── types/
│       └── index.ts    # Shared TypeScript types
├── data/               # SQLite database files
├── package.json
└── tsconfig.json
```

### 4. Implement database connection
Create database initialization with better-sqlite3.

**File:** `src/db/index.ts`
- Export singleton database instance
- Create `data/` directory if missing
- Initialize database file at `data/study.db`

### 5. Implement database schema
Create tables on first run.

**File:** `src/db/schema.ts`
- `initializeSchema(db)` function
- CREATE TABLE IF NOT EXISTS for all three tables
- Add foreign key constraints
- Create indexes on set_id and question_id

### 6. Define TypeScript types
Create shared type definitions.

**File:** `src/types/index.ts`
```typescript
export interface QuestionSet {
  id: string
  name: string
  createdAt: string
}

export interface Question {
  id: string
  setId: string
  question: string
  answer: string
}

export interface Attempt {
  id: string
  questionId: string
  correct: boolean
  timestamp: string
}
```

### 7. Implement models
Create data access layer for each entity.

**File:** `src/models/question-set.ts`
- `getAll(): QuestionSet[]`
- `getById(id): QuestionSet | null`
- `create(name): QuestionSet`
- `deleteById(id): boolean`
- `getQuestionCount(id): number`

**File:** `src/models/question.ts`
- `getBySetId(setId): Question[]`
- `create(setId, question, answer): Question`
- `createMany(setId, questions): Question[]`

**File:** `src/models/attempt.ts`
- `create(questionId, correct): Attempt`
- `getRecentByQuestionId(questionId, limit): Attempt[]`

### 8. Create Express server
Set up Express with health check endpoint.

**File:** `src/index.ts`
- Initialize database and schema
- Configure CORS (allow localhost:5173 for Vite)
- Add JSON body parser
- `GET /health` → `{ status: "ok", timestamp: ISO }`
- Start server on port 3001

### 9. Add npm scripts
Configure development and build scripts.

**File:** `package.json` scripts
```json
{
  "dev": "tsx watch src/index.ts",
  "build": "esbuild src/index.ts --bundle --platform=node --outfile=dist/index.js",
  "start": "node dist/index.js"
}
```

### 10. Verify setup
Test that server starts and health endpoint works.

**Verification:**
```bash
npm run dev
# In another terminal:
curl http://localhost:3001/health
```

Expected response: `{"status":"ok","timestamp":"2026-01-18T..."}`

## Verification

1. **Server starts:** `npm run dev` runs without errors
2. **Health check works:** `GET /health` returns 200 with JSON
3. **Database created:** `data/study.db` file exists
4. **Tables exist:** Can query `SELECT * FROM question_sets` without error
5. **TypeScript compiles:** `npx tsc --noEmit` passes
6. **Build works:** `npm run build` creates `dist/index.js`

## Success Criteria

- [ ] Backend project exists at `../study_tools_backend/`
- [ ] Express server runs on port 3001
- [ ] SQLite database initialized with three tables
- [ ] Health check endpoint responds correctly
- [ ] TypeScript strict mode passes
- [ ] All models have basic CRUD operations
- [ ] Development and production scripts work

## Output

- New directory: `../study_tools_backend/`
- Database file: `../study_tools_backend/data/study.db`
- Ready for Phase 2: API Layer

---
*Created: 2026-01-18*

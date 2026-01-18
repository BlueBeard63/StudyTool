# Study Tool Roadmap

## Milestone 1: Core Study Tool

A functional fill-in-the-blank study application with progress tracking.

### Phases

| # | Phase | Goal | Status |
|---|-------|------|--------|
| 1 | Backend Foundation | TypeScript backend with Express, SQLite database, and core data models for question sets, questions, and attempts | complete |
| 2 | API Layer | REST endpoints for CRUD operations on question sets, questions, and recording study attempts | complete |
| 3 | Frontend Shell | App layout with navigation, routing between views, and question set list display | complete |
| 4 | File Upload | Drag-and-drop JSON file upload with validation, filename-based naming, and custom name input | complete |
| 5 | Fill-in-Blank Engine | Core study mechanic: randomly blank 30-50% of answer words, render input fields, capture user responses | pending |
| 6 | Fuzzy Matching | Answer validation that accepts minor typos and spelling variations using string similarity | pending |
| 7 | Knowledge Scoring | Weighted scoring based on recent 5 attempts, visual dot indicators (green/orange/red/grey) | pending |
| 8 | Study Session Flow | One-at-a-time study mode: show question, check answer, show result, proceed to next | pending |
| 9 | Timed Mode | Alternative study mode with configurable timer, answer-as-many-as-possible flow | pending |
| 10 | Smart Ordering | Question selection that prioritizes weak areas (red/orange) over well-known material (green) | pending |

### Phase Details

#### Phase 1: Backend Foundation
**Goal:** TypeScript backend with Express, SQLite database, and core data models for question sets, questions, and attempts

**Delivers:**
- Express server in `../study_tools_backend/`
- SQLite database with better-sqlite3
- Schema for question_sets, questions, attempts tables
- Basic health check endpoint

**Research:** None required

---

#### Phase 2: API Layer
**Goal:** REST endpoints for CRUD operations on question sets, questions, and recording study attempts

**Delivers:**
- `GET/POST /api/sets` — list and create question sets
- `GET/DELETE /api/sets/:id` — get and delete individual sets
- `GET /api/sets/:id/questions` — get questions for a set
- `POST /api/attempts` — record a study attempt
- `GET /api/questions/:id/stats` — get attempt history/score for a question

**Research:** None required

---

#### Phase 3: Frontend Shell
**Goal:** App layout with navigation, routing between views, and question set list display

**Delivers:**
- App shell with header/navigation
- React Router setup (or similar)
- Question set list view (cards showing name, question count, overall progress)
- Empty states for no question sets

**Research:** None required

---

#### Phase 4: File Upload
**Goal:** Drag-and-drop JSON file upload with validation, filename-based naming, and custom name input

**Delivers:**
- Drag-and-drop zone component
- JSON structure validation
- Name input with filename as default
- Upload progress and success/error feedback
- Integration with backend POST /api/sets

**Research:** None required

---

#### Phase 5: Fill-in-Blank Engine
**Goal:** Core study mechanic: randomly blank 30-50% of answer words, render input fields, capture user responses

**Delivers:**
- Word tokenization algorithm
- Random word selection (30-50% blanked)
- Mixed text/input rendering component
- User input capture and submission

**Research:**
- Blanking algorithm: how to handle punctuation, preserve sentence structure
- Edge cases: very short answers, single-word answers

---

#### Phase 6: Fuzzy Matching
**Goal:** Answer validation that accepts minor typos and spelling variations using string similarity

**Delivers:**
- String similarity comparison (Levenshtein distance or similar)
- Configurable threshold for "close enough"
- Per-blank correct/incorrect feedback
- Overall answer scoring

**Research:**
- Library evaluation: string-similarity, fastest-levenshtein, fuzzball
- Threshold tuning: what similarity score = "correct"?

---

#### Phase 7: Knowledge Scoring
**Goal:** Weighted scoring based on recent 5 attempts, visual dot indicators (green/orange/red/grey)

**Delivers:**
- Score calculation: weighted average of recent 5 attempts [1.0, 0.8, 0.6, 0.4, 0.2]
- Color thresholds: green ≥0.7, orange 0.3-0.69, red <0.3, grey = no attempts
- Dot indicator component
- Scores displayed in question set list and study view

**Research:** None required

---

#### Phase 8: Study Session Flow
**Goal:** One-at-a-time study mode: show question, check answer, show result, proceed to next

**Delivers:**
- Study session state management
- Question display → fill blanks → submit → feedback → next flow
- Session progress indicator (X of Y questions)
- Session completion summary

**Research:** None required

---

#### Phase 9: Timed Mode
**Goal:** Alternative study mode with configurable timer, answer-as-many-as-possible flow

**Delivers:**
- Timer selection (1min, 3min, 5min, custom)
- Countdown display
- Rapid-fire question flow
- End-of-timer summary with stats

**Research:** None required

---

#### Phase 10: Smart Ordering
**Goal:** Question selection that prioritizes weak areas (red/orange) over well-known material (green)

**Delivers:**
- Question selection algorithm weighted by knowledge score
- Higher probability for low-score questions
- Configurable (or automatic) blend to occasionally include known material
- Integration with both study modes

**Research:** None required

---

## Dependencies

```
Phase 1 (Backend Foundation)
    ↓
Phase 2 (API Layer)
    ↓
Phase 3 (Frontend Shell) ← Phase 4 (File Upload)
    ↓
Phase 5 (Fill-in-Blank Engine)
    ↓
Phase 6 (Fuzzy Matching)
    ↓
Phase 7 (Knowledge Scoring)
    ↓
Phase 8 (Study Session Flow)
    ↓
Phase 9 (Timed Mode)
    ↓
Phase 10 (Smart Ordering)
```

---
*Created: 2026-01-18*

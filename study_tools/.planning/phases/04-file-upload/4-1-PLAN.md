# Phase 4-1: File Upload

## Objective

Add drag-and-drop JSON file upload with validation, filename-based naming, and custom name input. Users can upload question sets to study.

## Execution Context

### Stack
- React 19 + Vite 7
- Tailwind CSS 4 with custom theming
- Existing UI components: Button, Input, Card, Field, Label
- Lucide React icons

### Backend API
```
POST /api/sets
Body: { name: string, questions: [{ question: string, answer: string }] }
Returns: { id, name, createdAt, questionCount }
```

### Expected JSON Format
```json
{
  "questions": [
    { "question": "What is 2+2?", "answer": "4" },
    { "question": "Capital of France?", "answer": "Paris" }
  ]
}
```

Or simpler array format:
```json
[
  { "question": "What is 2+2?", "answer": "4" },
  { "question": "Capital of France?", "answer": "Paris" }
]
```

## Context

### Current State
- `SetsPage` shows list of sets or empty state
- `RootLayout` has header with title only
- API client has `fetchSets()` only
- No upload functionality exists

### Design Decisions
- Upload button in header (always visible)
- Modal/dialog for upload flow (not separate page)
- Drag-and-drop zone inside modal
- Filename becomes default set name (editable)
- Show validation errors inline
- After successful upload, refresh list and close modal

## Tasks

### 1. Add createSet to API Client

**Update `src/lib/api.ts`:**
```typescript
export interface CreateSetInput {
  name: string
  questions: { question: string; answer: string }[]
}

export async function createSet(input: CreateSetInput): Promise<QuestionSet> {
  const res = await fetch(`${API_BASE}/sets`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  })
  if (!res.ok) {
    const error = await res.json()
    throw new Error(error.error || "Failed to create set")
  }
  return res.json()
}
```

**Checkpoint:** Types compile

---

### 2. Create File Drop Zone Component

**Create `src/components/file-drop-zone.tsx`:**

Drag-and-drop zone with:
- Visual drop target with dashed border
- Drag-over highlight state
- File input fallback (click to browse)
- Accept only .json files
- onFileDrop callback with File

```typescript
import { useCallback, useState } from "react"
import { UploadIcon } from "lucide-react"

interface FileDropZoneProps {
  onFileDrop: (file: File) => void
  disabled?: boolean
}

export function FileDropZone({ onFileDrop, disabled }: FileDropZoneProps) {
  const [isDragOver, setIsDragOver] = useState(false)

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      setIsDragOver(false)
      const file = e.dataTransfer.files[0]
      if (file?.name.endsWith(".json")) {
        onFileDrop(file)
      }
    },
    [onFileDrop]
  )

  // ... drag handlers, file input, render
}
```

**Checkpoint:** Component renders drop zone

---

### 3. Create Upload Dialog Component

**Create `src/components/upload-dialog.tsx`:**

Dialog with:
- Trigger button (passed as children or default)
- FileDropZone inside
- After file selected: show name input (prefilled from filename)
- Submit button to create set
- Loading state during upload
- Error display
- Success: close dialog, call onSuccess callback

Uses existing AlertDialog or builds simple modal with Tailwind.

**Checkpoint:** Dialog opens/closes

---

### 4. Add JSON Validation

**Create `src/lib/validate-questions.ts`:**

```typescript
export interface QuestionInput {
  question: string
  answer: string
}

export interface ValidationResult {
  valid: boolean
  questions?: QuestionInput[]
  error?: string
}

export function validateQuestionsJson(json: unknown): ValidationResult {
  // Handle both { questions: [...] } and [...] formats
  // Validate each item has question and answer strings
  // Return normalized questions array or error
}
```

Integrate into upload dialog: parse file, validate, show errors or proceed.

**Checkpoint:** Validation catches malformed JSON

---

### 5. Integrate Upload into Header

**Update `src/components/layout/root-layout.tsx`:**

Add upload button to header:
```tsx
<header className="border-b border-border">
  <div className="mx-auto max-w-5xl px-4 py-4 flex items-center justify-between">
    <h1 className="text-lg font-semibold">Study Tool</h1>
    <UploadDialog onSuccess={() => { /* trigger refresh */ }} />
  </div>
</header>
```

**Problem:** How to refresh SetsPage after upload?

**Solution:** Use React Router's `useRevalidator()` or simpler: pass refresh trigger via context or just navigate. For now, use window reload or add a refresh key to route.

Simpler approach: UploadDialog navigates to "/" after success, triggering re-mount.

**Checkpoint:** Upload button visible in header

---

### 6. Wire Up End-to-End Flow

Complete integration:
1. Click upload button → dialog opens
2. Drop/select JSON file → validate
3. Show name input (filename minus .json)
4. Click create → POST to API
5. On success → close dialog, refresh list
6. On error → show error message

For list refresh, add a simple approach:
- After successful create, call `window.location.reload()` or
- Use React Router navigation to force re-render

**Checkpoint:** Full upload flow works

---

### 7. Verify and Polish

1. Start backend and frontend
2. Test upload flow:
   - Valid JSON file → creates set, appears in list
   - Invalid JSON → shows error
   - Empty questions → shows error
   - Cancel dialog → no changes
3. Check edge cases:
   - Drag non-JSON file → ignored
   - Very large file → handled gracefully
   - Network error → shows error

**Checkpoint:** All flows work correctly

---

## Verification

```bash
# Build passes
npm run build

# Lint passes
npm run lint

# Manual verification
# - Upload button visible in header
# - Dialog opens on click
# - Drag-drop works
# - File picker works
# - Name input shows filename
# - Valid JSON creates set
# - Invalid JSON shows error
# - List refreshes after upload
```

## Success Criteria

- [ ] Upload button in header
- [ ] Dialog opens with drop zone
- [ ] Drag-and-drop accepts .json files
- [ ] File picker fallback works
- [ ] JSON validation catches errors
- [ ] Both `{ questions: [...] }` and `[...]` formats work
- [ ] Name input prefilled from filename
- [ ] Successful upload creates set and refreshes list
- [ ] Error states displayed clearly
- [ ] TypeScript compiles
- [ ] Build passes

## Output

### New Files
```
src/
├── components/
│   ├── file-drop-zone.tsx   # Drag-and-drop zone
│   └── upload-dialog.tsx    # Upload modal with form
└── lib/
    └── validate-questions.ts # JSON validation
```

### Modified Files
```
src/lib/api.ts                    # Add createSet function
src/components/layout/root-layout.tsx  # Add upload button
```

---

## Scope Estimate

**Size:** Small (single plan)
**Tasks:** 7
**Complexity:** Low-Medium — file handling and validation logic

---
*Created: 2026-01-18*

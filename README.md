# Study Tool

A fill-in-the-blank study app for memorizing Q&A content. Tracks your scores and prioritizes questions you struggle with.

## Features

- **Practice Mode** - Work through questions at your own pace
- **Timed Mode** - Race against the clock with smart question selection
- **Difficulty Levels** - Easy through extreme (controls how many blanks)
- **Word Bank** - Optional mode for selecting answers instead of typing
- **Score Tracking** - Remembers how well you know each question

## Quick Start

### Prerequisites

- Node.js 18+

### Install

```bash
cd StudyTool
npm run install:all
```

### Run

```bash
npm run dev
```

This starts both the backend (port 3001) and frontend (port 5173).

Open http://localhost:5173 in your browser.

### With Docker

```bash
docker compose up
```

## Development

Run backend and frontend separately for better logs:

```bash
# Terminal 1 - Backend
cd study_tools_backend
npm run dev

# Terminal 2 - Frontend
cd study_tools
npm run dev
```

### Building

```bash
# Frontend
cd study_tools
npm run build

# Backend
cd study_tools_backend
npm run build
```

## Data

Questions are stored in a SQLite database at `study_tools_backend/data/study.db`.

To persist data in a different location with Docker, create a `.env` file:

```env
DATA_DIR=/path/to/your/data
```

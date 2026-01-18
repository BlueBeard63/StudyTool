import express from "express"
import cors from "cors"
import db from "./db/index.js"
import { initializeSchema } from "./db/schema.js"

const app = express()
const PORT = process.env.PORT || 3001

initializeSchema(db)

app.use(
  cors({
    origin: ["http://localhost:5173", "http://127.0.0.1:5173"],
  })
)
app.use(express.json())

app.get("/health", (_req, res) => {
  res.json({
    status: "ok",
    timestamp: new Date().toISOString(),
  })
})

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`)
})

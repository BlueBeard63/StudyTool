import express from "express"
import cors from "cors"
import db from "./db/index.js"
import { initializeSchema } from "./db/schema.js"
import apiRouter from "./routes/index.js"

const app = express()
const PORT = process.env.PORT || 3001

initializeSchema(db)

app.use(
  cors({
    origin: true, // Allow all origins in development
  })
)
app.use(express.json())

app.get("/health", (_req, res) => {
  res.json({
    status: "ok",
    timestamp: new Date().toISOString(),
  })
})

app.use("/api", apiRouter)

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`)
})

import { useEffect, useState } from "react"
import { Link, Outlet, useNavigate } from "react-router"

import { Badge } from "@/components/ui/badge"
import { UploadDialog } from "@/components/upload-dialog"
import { fetchDueQuestions } from "@/lib/api"

export function RootLayout() {
  const navigate = useNavigate()
  const [dueCount, setDueCount] = useState(0)

  useEffect(() => {
    fetchDueQuestions()
      .then((questions) => setDueCount(questions.length))
      .catch(() => setDueCount(0))
  }, [])

  const handleUploadSuccess = () => {
    // Navigate to home to trigger re-fetch of sets
    navigate("/", { replace: true })
    // Force re-render by navigating away and back
    window.location.reload()
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b border-border">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4">
          <div className="flex items-center gap-6">
            <h1 className="text-lg font-semibold">Study Tool</h1>
            <nav className="flex gap-4">
              <Link to="/" className="text-sm text-muted-foreground hover:text-foreground">
                Sets
              </Link>
              <Link to="/review" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
                Review
                {dueCount > 0 && (
                  <Badge variant="destructive" className="h-4 px-1.5 text-[10px]">
                    {dueCount}
                  </Badge>
                )}
              </Link>
              <Link to="/stats" className="text-sm text-muted-foreground hover:text-foreground">
                Stats
              </Link>
            </nav>
          </div>
          <UploadDialog onSuccess={handleUploadSuccess} />
        </div>
      </header>
      <main className="mx-auto max-w-5xl px-4 py-6">
        <Outlet />
      </main>
    </div>
  )
}

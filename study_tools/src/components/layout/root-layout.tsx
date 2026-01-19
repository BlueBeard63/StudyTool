import { Link, Outlet, useNavigate } from "react-router"

import { UploadDialog } from "@/components/upload-dialog"

export function RootLayout() {
  const navigate = useNavigate()

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

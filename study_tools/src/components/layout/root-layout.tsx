import { Outlet, useNavigate } from "react-router"

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
          <h1 className="text-lg font-semibold">Study Tool</h1>
          <UploadDialog onSuccess={handleUploadSuccess} />
        </div>
      </header>
      <main className="mx-auto max-w-5xl px-4 py-6">
        <Outlet />
      </main>
    </div>
  )
}

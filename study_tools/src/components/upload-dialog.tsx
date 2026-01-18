import { useCallback, useState } from "react"
import { Dialog as DialogPrimitive } from "radix-ui"
import { UploadIcon, XIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { FileDropZone } from "@/components/file-drop-zone"
import { createSet } from "@/lib/api"
import { validateQuestionsJson, type QuestionInput } from "@/lib/validate-questions"
import { cn } from "@/lib/utils"

interface UploadDialogProps {
  onSuccess?: () => void
}

export function UploadDialog({ onSuccess }: UploadDialogProps) {
  const [open, setOpen] = useState(false)
  const [step, setStep] = useState<"drop" | "form">("drop")
  const [name, setName] = useState("")
  const [questions, setQuestions] = useState<QuestionInput[]>([])
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const reset = useCallback(() => {
    setStep("drop")
    setName("")
    setQuestions([])
    setError(null)
    setLoading(false)
  }, [])

  const handleOpenChange = useCallback(
    (nextOpen: boolean) => {
      setOpen(nextOpen)
      if (!nextOpen) {
        reset()
      }
    },
    [reset]
  )

  const handleFileDrop = useCallback(async (file: File) => {
    setError(null)

    try {
      const text = await file.text()
      const json = JSON.parse(text)
      const result = validateQuestionsJson(json)

      if (!result.valid) {
        setError(result.error || "Invalid file format")
        return
      }

      // Use filename (without .json) as default name
      const defaultName = file.name.replace(/\.json$/i, "")
      setName(defaultName)
      setQuestions(result.questions!)
      setStep("form")
    } catch {
      setError("Failed to parse JSON file")
    }
  }, [])

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault()
      if (!name.trim() || questions.length === 0) return

      setLoading(true)
      setError(null)

      try {
        await createSet({ name: name.trim(), questions })
        setOpen(false)
        reset()
        onSuccess?.()
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to create set")
      } finally {
        setLoading(false)
      }
    },
    [name, questions, onSuccess, reset]
  )

  return (
    <DialogPrimitive.Root open={open} onOpenChange={handleOpenChange}>
      <DialogPrimitive.Trigger asChild>
        <Button variant="outline" size="sm">
          <UploadIcon data-icon="inline-start" />
          Upload
        </Button>
      </DialogPrimitive.Trigger>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-black/80 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:animate-in data-[state=open]:fade-in-0" />
        <DialogPrimitive.Content
          className={cn(
            "fixed left-1/2 top-1/2 z-50 w-full max-w-md -translate-x-1/2 -translate-y-1/2",
            "rounded-xl bg-background p-6 ring-1 ring-foreground/10",
            "data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95",
            "data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95"
          )}
        >
          <div className="flex items-center justify-between">
            <DialogPrimitive.Title className="text-sm font-semibold">
              {step === "drop" ? "Upload Question Set" : "Create Question Set"}
            </DialogPrimitive.Title>
            <DialogPrimitive.Close asChild>
              <Button variant="ghost" size="icon-sm">
                <XIcon />
              </Button>
            </DialogPrimitive.Close>
          </div>

          <div className="mt-4">
            {step === "drop" && (
              <>
                <FileDropZone onFileDrop={handleFileDrop} disabled={loading} />
                {error && (
                  <p className="mt-2 text-xs text-destructive">{error}</p>
                )}
              </>
            )}

            {step === "form" && (
              <form onSubmit={handleSubmit}>
                <div className="space-y-4">
                  <div>
                    <label
                      htmlFor="set-name"
                      className="mb-1 block text-xs font-medium"
                    >
                      Set Name
                    </label>
                    <Input
                      id="set-name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Enter set name"
                      disabled={loading}
                      autoFocus
                    />
                  </div>

                  <p className="text-xs text-muted-foreground">
                    {questions.length} question
                    {questions.length !== 1 ? "s" : ""} found
                  </p>

                  {error && (
                    <p className="text-xs text-destructive">{error}</p>
                  )}

                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setStep("drop")
                        setError(null)
                      }}
                      disabled={loading}
                    >
                      Back
                    </Button>
                    <Button type="submit" disabled={loading || !name.trim()}>
                      {loading ? "Creating..." : "Create Set"}
                    </Button>
                  </div>
                </div>
              </form>
            )}
          </div>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  )
}

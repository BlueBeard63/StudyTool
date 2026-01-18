import { useCallback, useRef, useState } from "react"
import { UploadIcon } from "lucide-react"

import { cn } from "@/lib/utils"

interface FileDropZoneProps {
  onFileDrop: (file: File) => void
  disabled?: boolean
}

export function FileDropZone({ onFileDrop, disabled }: FileDropZoneProps) {
  const [isDragOver, setIsDragOver] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      setIsDragOver(false)
      if (disabled) return

      const file = e.dataTransfer.files[0]
      if (file?.name.endsWith(".json")) {
        onFileDrop(file)
      }
    },
    [onFileDrop, disabled]
  )

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
  }, [])

  const handleClick = useCallback(() => {
    if (!disabled) {
      inputRef.current?.click()
    }
  }, [disabled])

  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0]
      if (file) {
        onFileDrop(file)
      }
      // Reset input so same file can be selected again
      e.target.value = ""
    },
    [onFileDrop]
  )

  return (
    <div
      onClick={handleClick}
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      className={cn(
        "flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed p-8 transition-colors",
        isDragOver
          ? "border-primary bg-primary/5"
          : "border-border hover:border-primary/50",
        disabled && "cursor-not-allowed opacity-50"
      )}
    >
      <UploadIcon className="size-8 text-muted-foreground" />
      <div className="text-center">
        <p className="text-sm font-medium">Drop a JSON file here</p>
        <p className="text-xs text-muted-foreground">or click to browse</p>
      </div>
      <input
        ref={inputRef}
        type="file"
        accept=".json"
        onChange={handleFileChange}
        className="hidden"
      />
    </div>
  )
}

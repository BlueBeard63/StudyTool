import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

interface DueReviewSectionProps {
  totalDue: number
  onStartReview: () => void
}

export function DueReviewSection({
  totalDue,
  onStartReview,
}: DueReviewSectionProps) {
  return (
    <Card className="mb-6">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg">Due for Review</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col items-center gap-4 py-4">
        <div className="text-center">
          <div className="text-4xl font-bold">{totalDue}</div>
          <div className="text-sm text-muted-foreground">
            question{totalDue !== 1 ? "s" : ""} scheduled for today
          </div>
        </div>
        <Button
          size="lg"
          onClick={onStartReview}
          disabled={totalDue === 0}
        >
          Start Review
        </Button>
      </CardContent>
    </Card>
  )
}

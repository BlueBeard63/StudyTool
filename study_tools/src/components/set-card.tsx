import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card"
import type { QuestionSet } from "@/lib/api"

interface SetCardProps {
  set: QuestionSet
}

export function SetCard({ set }: SetCardProps) {
  return (
    <Card className="cursor-pointer transition-all hover:ring-2 hover:ring-primary/50">
      <CardHeader>
        <CardTitle>{set.name}</CardTitle>
        <CardDescription>
          {set.questionCount} question{set.questionCount !== 1 ? "s" : ""}
        </CardDescription>
      </CardHeader>
    </Card>
  )
}

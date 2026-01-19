import { Link } from "react-router"

import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import type { QuestionSet } from "@/lib/api"

interface SetCardProps {
  set: QuestionSet
}

export function SetCard({ set }: SetCardProps) {
  const dueCount = set.dueCount || 0

  return (
    <Link to={`/sets/${set.id}`}>
      <Card className="cursor-pointer transition-all hover:ring-2 hover:ring-primary/50">
        <CardHeader className="relative">
          {dueCount > 0 && (
            <Badge
              variant="destructive"
              className="absolute right-4 top-4"
            >
              {dueCount} due
            </Badge>
          )}
          <CardTitle className="pr-16">{set.name}</CardTitle>
          <CardDescription>
            {set.questionCount} question{set.questionCount !== 1 ? "s" : ""}
          </CardDescription>
        </CardHeader>
      </Card>
    </Link>
  )
}

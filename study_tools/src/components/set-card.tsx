import { Link } from "react-router"

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
    <Link to={`/sets/${set.id}`}>
      <Card className="cursor-pointer transition-all hover:ring-2 hover:ring-primary/50">
        <CardHeader>
          <CardTitle>{set.name}</CardTitle>
          <CardDescription>
            {set.questionCount} question{set.questionCount !== 1 ? "s" : ""}
          </CardDescription>
        </CardHeader>
      </Card>
    </Link>
  )
}

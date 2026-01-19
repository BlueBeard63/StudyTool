import { createBrowserRouter } from "react-router"

import { RootLayout } from "@/components/layout/root-layout"
import { HistoryPage } from "@/pages/history"
import { ReviewPage } from "@/pages/review"
import { SetDetailPage } from "@/pages/set-detail"
import { SetsPage } from "@/pages/sets"
import { StatsPage } from "@/pages/stats"
import { StudyPage } from "@/pages/study"

export const router = createBrowserRouter([
  {
    path: "/",
    element: <RootLayout />,
    children: [
      { index: true, element: <SetsPage /> },
      { path: "history", element: <HistoryPage /> },
      { path: "review", element: <ReviewPage /> },
      { path: "sets/:setId", element: <SetDetailPage /> },
      { path: "sets/:setId/study", element: <StudyPage /> },
      { path: "stats", element: <StatsPage /> },
    ],
  },
])

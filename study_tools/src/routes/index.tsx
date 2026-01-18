import { createBrowserRouter } from "react-router"

import { RootLayout } from "@/components/layout/root-layout"
import { SetsPage } from "@/pages/sets"
import { StudyPage } from "@/pages/study"

export const router = createBrowserRouter([
  {
    path: "/",
    element: <RootLayout />,
    children: [
      { index: true, element: <SetsPage /> },
      { path: "sets/:setId/study", element: <StudyPage /> },
    ],
  },
])

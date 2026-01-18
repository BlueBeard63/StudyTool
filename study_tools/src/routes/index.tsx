import { createBrowserRouter } from "react-router"

import { RootLayout } from "@/components/layout/root-layout"
import { SetsPage } from "@/pages/sets"

export const router = createBrowserRouter([
  {
    path: "/",
    element: <RootLayout />,
    children: [{ index: true, element: <SetsPage /> }],
  },
])

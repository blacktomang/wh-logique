import { createBrowserRouter } from "react-router-dom";
import { AppLayout } from "../layouts/AppLayout";
import { ItemsPage } from "../pages/ItemsPage";
import { ItemNewPage } from "../pages/ItemNewPage";
import { ItemDetailPage } from "../pages/ItemDetailPage";
import { LocationsPage } from "../pages/LocationsPage";
import { NotFound } from "./NotFound";
import { ErrorBoundary } from "./ErrorBoundary";
import { paths } from "./paths";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <AppLayout />,
    errorElement: <ErrorBoundary />,
    children: [
      { index: true, element: <ItemsPage /> },
      { path: paths.items, element: <ItemsPage /> },
      { path: paths.itemNew, element: <ItemNewPage /> },
      { path: paths.itemDetail(":id"), element: <ItemDetailPage /> },
      { path: paths.locations, element: <LocationsPage /> },
      { path: "*", element: <NotFound /> },
    ],
  },
]);

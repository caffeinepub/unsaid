import { Toaster } from "@/components/ui/sonner";
import {
  Outlet,
  RouterProvider,
  createRootRoute,
  createRoute,
  createRouter,
} from "@tanstack/react-router";
import { AdminPage } from "./pages/AdminPage";
import { CreatePage } from "./pages/CreatePage";
import { HomePage } from "./pages/HomePage";
import { PostDetailPage } from "./pages/PostDetailPage";

// ── Root route ─────────────────────────────────────────────────────────────

const rootRoute = createRootRoute({
  component: () => (
    <div className="dark">
      <Outlet />
      <Toaster position="top-center" />
    </div>
  ),
});

// ── Routes ─────────────────────────────────────────────────────────────────

const homeRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/",
  validateSearch: (
    search: Record<string, unknown>,
  ): { tab?: string; category?: string } => ({
    tab: (search.tab as string) ?? "trending",
    category: search.category as string | undefined,
  }),
  component: HomePage,
});

const postDetailRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/post/$id",
  component: PostDetailPage,
});

const createRoute_ = createRoute({
  getParentRoute: () => rootRoute,
  path: "/create",
  component: CreatePage,
});

const adminRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/admin",
  component: AdminPage,
});

// ── Router ─────────────────────────────────────────────────────────────────

const routeTree = rootRoute.addChildren([
  homeRoute,
  postDetailRoute,
  createRoute_,
  adminRoute,
]);

const router = createRouter({ routeTree });

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}

export default function App() {
  return <RouterProvider router={router} />;
}

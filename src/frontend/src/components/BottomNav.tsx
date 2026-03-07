import { Link, useMatchRoute } from "@tanstack/react-router";
import { Home, Plus, ShieldAlert, TrendingUp } from "lucide-react";

interface BottomNavProps {
  onCreateClick?: () => void;
}

export function BottomNav({ onCreateClick }: BottomNavProps) {
  const matchRoute = useMatchRoute();
  const isHome = !!matchRoute({ to: "/", fuzzy: false });
  const isAdmin = !!matchRoute({ to: "/admin", fuzzy: true });

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-40 flex items-center justify-around"
      style={{
        height: "calc(60px + env(safe-area-inset-bottom, 0px))",
        paddingBottom: "env(safe-area-inset-bottom, 0px)",
        // Rich layered background: base + subtle radial bloom at top center
        background:
          "radial-gradient(ellipse 60% 40px at 50% 0%, oklch(0.45 0.12 285 / 0.12) 0%, transparent 100%), oklch(0.115 0.008 285)",
        borderTop: "1px solid oklch(0.22 0.012 285 / 0.8)",
        backdropFilter: "blur(16px)",
      }}
      aria-label="Main navigation"
    >
      {/* Home */}
      <Link
        to="/"
        search={{ tab: "trending", category: undefined }}
        className="flex flex-col items-center justify-center gap-0.5 min-w-[60px] min-h-[44px] px-2 relative"
        data-ocid="nav.home.link"
        aria-label="Home"
        aria-current={isHome ? "page" : undefined}
      >
        {/* Active pill background */}
        {isHome && (
          <span
            className="absolute inset-x-1 top-1 bottom-1 rounded-xl"
            style={{ background: "oklch(0.65 0.22 285 / 0.13)" }}
            aria-hidden="true"
          />
        )}
        <span className="relative">
          <Home
            size={19}
            strokeWidth={isHome ? 2.5 : 1.8}
            className={`transition-colors duration-150 ${isHome ? "text-[oklch(0.78_0.22_285)]" : "text-[oklch(0.46_0.01_285)]"}`}
          />
        </span>
        <span
          className={`relative text-[10px] font-semibold tracking-wide transition-colors duration-150 ${isHome ? "text-[oklch(0.78_0.22_285)]" : "text-[oklch(0.4_0.01_285)]"}`}
        >
          Home
        </span>
      </Link>

      {/* Trending */}
      <Link
        to="/"
        search={{ tab: "trending", category: undefined }}
        className="flex flex-col items-center justify-center gap-0.5 min-w-[60px] min-h-[44px] px-2 relative"
        data-ocid="nav.trending.link"
        aria-label="Trending"
      >
        <TrendingUp
          size={19}
          strokeWidth={1.8}
          className="text-[oklch(0.46_0.01_285)] transition-colors duration-150 hover:text-[oklch(0.65_0.22_285)]"
        />
        <span className="text-[10px] font-semibold tracking-wide text-[oklch(0.4_0.01_285)]">
          Hot
        </span>
      </Link>

      {/* Post — accent pill CTA */}
      <button
        type="button"
        onClick={onCreateClick}
        className="flex flex-col items-center justify-center min-w-[60px] min-h-[44px] px-2 relative group"
        data-ocid="nav.create.link"
        aria-label="Create post"
      >
        {/* Filled accent pill */}
        <span
          className="flex items-center justify-center w-[42px] h-[30px] rounded-full transition-all duration-150 group-active:scale-95"
          style={{
            background:
              "linear-gradient(135deg, oklch(0.72 0.22 285), oklch(0.60 0.22 300))",
            boxShadow: "0 0 12px oklch(0.65 0.22 285 / 0.45)",
          }}
        >
          <Plus size={16} strokeWidth={2.5} className="text-white" />
        </span>
        <span className="text-[10px] font-semibold tracking-wide text-[oklch(0.55_0.01_285)] mt-0.5">
          Post
        </span>
      </button>

      {/* Admin */}
      <Link
        to="/admin"
        className="flex flex-col items-center justify-center gap-0.5 min-w-[60px] min-h-[44px] px-2 relative"
        data-ocid="nav.admin.link"
        aria-label="Admin"
        aria-current={isAdmin ? "page" : undefined}
      >
        {isAdmin && (
          <span
            className="absolute inset-x-1 top-1 bottom-1 rounded-xl"
            style={{ background: "oklch(0.65 0.22 285 / 0.13)" }}
            aria-hidden="true"
          />
        )}
        <span className="relative">
          <ShieldAlert
            size={19}
            strokeWidth={isAdmin ? 2.5 : 1.8}
            className={`transition-colors duration-150 ${isAdmin ? "text-[oklch(0.78_0.22_285)]" : "text-[oklch(0.46_0.01_285)]"}`}
          />
        </span>
        <span
          className={`relative text-[10px] font-semibold tracking-wide transition-colors duration-150 ${isAdmin ? "text-[oklch(0.78_0.22_285)]" : "text-[oklch(0.4_0.01_285)]"}`}
        >
          Admin
        </span>
      </Link>
    </nav>
  );
}

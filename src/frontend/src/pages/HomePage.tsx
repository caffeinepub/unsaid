import { Button } from "@/components/ui/button";
import { useNavigate, useSearch } from "@tanstack/react-router";
import { Clock, Flame, Ghost, Plus } from "lucide-react";
import { useCallback, useState } from "react";
import { PostTab } from "../backend.d";
import { BottomNav } from "../components/BottomNav";
import { CreatePostSheet } from "../components/CreatePostSheet";
import { PostCard } from "../components/PostCard";
import { PostSkeletonList } from "../components/PostSkeleton";
import {
  useGetCategories,
  useGetPosts,
  useUpvotePost,
} from "../hooks/useQueries";

const PAGE_SIZE = BigInt(10);

export function HomePage() {
  const search = useSearch({ from: "/" }) as {
    tab?: string;
    category?: string;
  };
  const navigate = useNavigate();

  const activeTab = (
    search.tab === "latest" ? PostTab.latest : PostTab.trending
  ) as PostTab;
  const activeCategoryId = search.category ? BigInt(search.category) : null;

  const [page, setPage] = useState(BigInt(0));
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  // Track which post IDs have upvotes in-flight
  const [pendingUpvoteIds, setPendingUpvoteIds] = useState<Set<string>>(
    new Set(),
  );

  const { data: categories } = useGetCategories();
  const {
    data: postsPage,
    isLoading,
    isFetching,
  } = useGetPosts(
    activeTab,
    activeCategoryId,
    BigInt(0),
    PAGE_SIZE * (page + BigInt(1)),
  );

  const upvotePost = useUpvotePost();

  const activeCategories = categories?.filter((c) => c.isActive) ?? [];
  const posts = postsPage?.posts ?? [];
  const totalCount = Number(postsPage?.totalCount ?? 0);
  const hasMore = posts.length < totalCount;

  const handleTabChange = (tab: PostTab) => {
    setPage(BigInt(0));
    navigate({
      to: "/",
      search: {
        tab: tab === PostTab.trending ? "trending" : "latest",
        category: search.category,
      },
    });
  };

  const handleCategoryChange = (catId: string | null) => {
    setPage(BigInt(0));
    navigate({
      to: "/",
      search: { tab: search.tab ?? "trending", category: catId ?? undefined },
    });
  };

  const handleLoadMore = useCallback(() => {
    setPage((p) => p + BigInt(1));
  }, []);

  const handleUpvote = useCallback(
    async (postId: bigint) => {
      const key = String(postId);
      setPendingUpvoteIds((prev) => new Set(prev).add(key));
      try {
        await upvotePost.mutateAsync({ postId });
      } finally {
        setPendingUpvoteIds((prev) => {
          const next = new Set(prev);
          next.delete(key);
          return next;
        });
      }
    },
    [upvotePost],
  );

  return (
    <div className="min-h-screen bg-[oklch(0.1_0.005_285)]">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-[oklch(0.1_0.005_285/0.95)] backdrop-blur-md border-b border-[oklch(0.22_0.012_285)]">
        <div className="max-w-[480px] mx-auto px-4 pt-4 pb-3">
          {/* Logo */}
          <div className="flex items-center justify-between mb-3">
            <div>
              <h1 className="font-display font-bold text-[oklch(0.94_0.005_285)] text-2xl tracking-tight leading-none">
                Un
                <span className="text-[oklch(0.75_0.22_285)]">said</span>
              </h1>
              <p className="text-xs text-[oklch(0.45_0.01_285)] mt-0.5 font-body">
                speak freely · stay anonymous
              </p>
            </div>
            <Ghost
              size={28}
              className="text-[oklch(0.45_0.01_285)]"
              strokeWidth={1.5}
            />
          </div>

          {/* Tab bar */}
          <div className="flex gap-1 bg-[oklch(0.16_0.008_285)] rounded-xl p-1">
            <button
              type="button"
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-sm font-semibold transition-all min-h-[36px] ${
                activeTab === PostTab.trending
                  ? "bg-[oklch(0.65_0.22_285)] text-white shadow-glow-sm"
                  : "text-[oklch(0.55_0.01_285)] hover:text-[oklch(0.8_0.01_285)]"
              }`}
              onClick={() => handleTabChange(PostTab.trending)}
              data-ocid="home.tab.trending"
              aria-pressed={activeTab === PostTab.trending}
            >
              <Flame size={14} strokeWidth={2} />
              Trending
            </button>
            <button
              type="button"
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-sm font-semibold transition-all min-h-[36px] ${
                activeTab === PostTab.latest
                  ? "bg-[oklch(0.65_0.22_285)] text-white shadow-glow-sm"
                  : "text-[oklch(0.55_0.01_285)] hover:text-[oklch(0.8_0.01_285)]"
              }`}
              onClick={() => handleTabChange(PostTab.latest)}
              data-ocid="home.tab.latest"
              aria-pressed={activeTab === PostTab.latest}
            >
              <Clock size={14} strokeWidth={2} />
              Latest
            </button>
          </div>
        </div>

        {/* Category chips */}
        <div className="chips-scroll scrollbar-hide px-4 pb-3 max-w-[480px] mx-auto">
          <div className="flex gap-2 w-max">
            <button
              type="button"
              className={`inline-flex items-center px-3 py-1.5 text-xs font-semibold rounded-full border whitespace-nowrap transition-all min-h-[32px] ${
                activeCategoryId === null
                  ? "bg-[oklch(0.65_0.22_285/0.2)] text-[oklch(0.75_0.22_285)] border-[oklch(0.65_0.22_285/0.4)]"
                  : "bg-[oklch(0.16_0.008_285)] text-[oklch(0.55_0.01_285)] border-[oklch(0.22_0.01_285)] hover:border-[oklch(0.35_0.015_285)]"
              }`}
              onClick={() => handleCategoryChange(null)}
              data-ocid="home.all_categories.tab"
            >
              All
            </button>
            {activeCategories.map((cat, i) => {
              const isActive = activeCategoryId === cat.id;
              return (
                <button
                  type="button"
                  key={String(cat.id)}
                  className={`inline-flex items-center px-3 py-1.5 text-xs font-semibold rounded-full border whitespace-nowrap transition-all min-h-[32px] ${
                    isActive
                      ? "bg-[oklch(0.65_0.22_285/0.2)] text-[oklch(0.75_0.22_285)] border-[oklch(0.65_0.22_285/0.4)]"
                      : "bg-[oklch(0.16_0.008_285)] text-[oklch(0.55_0.01_285)] border-[oklch(0.22_0.01_285)] hover:border-[oklch(0.35_0.015_285)]"
                  }`}
                  onClick={() => handleCategoryChange(String(cat.id))}
                  data-ocid={`home.category.tab.${i + 1}`}
                  aria-pressed={isActive}
                >
                  {cat.name}
                </button>
              );
            })}
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-[480px] mx-auto px-4 pt-4 pb-safe">
        {isLoading ? (
          <PostSkeletonList count={6} />
        ) : posts.length === 0 ? (
          <div
            className="flex flex-col items-center justify-center py-20 text-center"
            data-ocid="home.empty_state"
          >
            <Ghost
              size={48}
              className="text-[oklch(0.3_0.01_285)] mb-4"
              strokeWidth={1}
            />
            <p className="font-display font-semibold text-[oklch(0.5_0.01_285)] text-lg mb-1">
              Nothing yet
            </p>
            <p className="text-sm text-[oklch(0.38_0.01_285)]">
              Be the first to share something.
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {posts.map((post, i) => (
              <PostCard
                key={String(post.id)}
                post={post}
                categories={categories ?? []}
                index={i + 1}
                onUpvote={handleUpvote}
                isUpvoting={pendingUpvoteIds.has(String(post.id))}
              />
            ))}

            {/* Load more */}
            {hasMore && (
              <Button
                variant="outline"
                className="w-full mt-2 border-[oklch(0.28_0.015_285)] text-[oklch(0.65_0.01_285)] hover:bg-[oklch(0.18_0.01_285)] hover:text-[oklch(0.85_0.01_285)] min-h-[44px]"
                onClick={handleLoadMore}
                disabled={isFetching}
                data-ocid="home.pagination_next"
              >
                {isFetching
                  ? "Loading..."
                  : `Load more (${totalCount - posts.length} left)`}
              </Button>
            )}
          </div>
        )}
        {/* Footer */}
        <footer className="mt-6 pt-4 border-t border-[oklch(0.18_0.008_285)] text-center">
          <p className="text-[11px] text-[oklch(0.32_0.01_285)]">
            © {new Date().getFullYear()} ·{" "}
            <a
              href={`https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(typeof window !== "undefined" ? window.location.hostname : "")}`}
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-[oklch(0.55_0.01_285)] transition-colors underline underline-offset-2"
            >
              Built with ♥ using caffeine.ai
            </a>
          </p>
        </footer>
      </main>

      {/* Floating create button */}
      <button
        type="button"
        onClick={() => setIsCreateOpen(true)}
        className="fixed right-4 z-50 w-14 h-14 rounded-2xl bg-[oklch(0.65_0.22_285)] hover:bg-[oklch(0.70_0.22_285)] active:scale-95 text-white shadow-glow flex items-center justify-center transition-all"
        style={{ bottom: "calc(76px + env(safe-area-inset-bottom, 0px))" }}
        data-ocid="home.create.button"
        aria-label="Create new post"
      >
        <Plus size={24} strokeWidth={2.5} />
      </button>

      <BottomNav onCreateClick={() => setIsCreateOpen(true)} />

      <CreatePostSheet open={isCreateOpen} onOpenChange={setIsCreateOpen} />
    </div>
  );
}

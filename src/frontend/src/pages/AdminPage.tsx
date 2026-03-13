import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { useNavigate } from "@tanstack/react-router";
import {
  ArrowLeft,
  Ban,
  BarChart3,
  ChevronDown,
  ChevronRight,
  Eye,
  FileText,
  KeyRound,
  Loader2,
  MessageSquare,
  Plus,
  ShieldCheck,
  Tag,
  Trash2,
  X,
} from "lucide-react";
import { useRef, useState } from "react";
import { toast } from "sonner";
import type { PostId } from "../backend.d";
import { PostTab } from "../backend.d";
import {
  useAdminAddCategory,
  useAdminAddKeyword,
  useAdminDeleteComment,
  useAdminDeletePost,
  useAdminGetBannedIps,
  useAdminGetBlockedKeywords,
  useAdminGetCategories,
  useAdminRemoveCategory,
  useAdminRemoveKeyword,
  useAdminUnbanIp,
  useGetComments,
  useGetPosts,
  useGetStats,
} from "../hooks/useQueries";
import { relativeTime } from "../utils/time";

const ADMIN_STORAGE_KEY = "wb_admin_auth";
const ADMIN_PASSWORD = "whisper2024";

const toastSuccess = () => ({
  style: {
    background: "oklch(0.16 0.01 285)",
    border: "1px solid oklch(0.25 0.015 285)",
    color: "oklch(0.94 0.005 285)",
  },
});
const toastError = () => ({
  style: {
    background: "oklch(0.16 0.01 285)",
    border: "1px solid oklch(0.62 0.22 22 / 0.4)",
    color: "oklch(0.94 0.005 285)",
  },
});

function AdminGate({ onAuth }: { onAuth: () => void }) {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === ADMIN_PASSWORD) {
      // Use sessionStorage so auth clears when the tab closes
      sessionStorage.setItem(ADMIN_STORAGE_KEY, "true");
      onAuth();
    } else {
      setError("Incorrect password.");
      setPassword("");
    }
  };

  return (
    <div className="min-h-screen bg-[oklch(0.1_0.005_285)] flex items-center justify-center p-6">
      <div className="w-full max-w-[360px]">
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-[oklch(0.65_0.22_285/0.15)] border border-[oklch(0.65_0.22_285/0.3)] flex items-center justify-center mb-4">
            <ShieldCheck size={32} className="text-[oklch(0.65_0.22_285)]" />
          </div>
          <h1 className="font-display font-bold text-[oklch(0.94_0.005_285)] text-2xl">
            Admin Access
          </h1>
          <p className="text-sm text-[oklch(0.5_0.01_285)] mt-1">
            Unsaid Control Panel
          </p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label
              htmlFor="admin-password"
              className="text-[oklch(0.7_0.01_285)] text-sm"
            >
              Password
            </Label>
            <Input
              id="admin-password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter admin password"
              className="bg-[oklch(0.16_0.008_285)] border-[oklch(0.28_0.015_285)] text-[oklch(0.94_0.005_285)] placeholder:text-[oklch(0.38_0.01_285)] focus-visible:ring-[oklch(0.65_0.22_285/0.5)] min-h-[48px] text-base"
              autoComplete="current-password"
              data-ocid="admin.password.input"
            />
            {error && (
              <p
                className="text-xs text-[oklch(0.62_0.22_22)]"
                data-ocid="admin.password.error_state"
              >
                {error}
              </p>
            )}
          </div>
          <Button
            type="submit"
            className="min-h-[48px] bg-[oklch(0.65_0.22_285)] hover:bg-[oklch(0.70_0.22_285)] text-white font-semibold rounded-xl shadow-glow-sm"
            data-ocid="admin.password.submit_button"
          >
            Access Dashboard
          </Button>
        </form>
      </div>
    </div>
  );
}

// ── Overview Tab ───────────────────────────────────────────────────────────

function OverviewTab() {
  const { data: stats, isLoading } = useGetStats();

  if (isLoading) {
    return (
      <div
        className="grid grid-cols-2 gap-3"
        data-ocid="admin.overview.loading_state"
      >
        {[1, 2, 3, 4].map((i) => (
          <Skeleton
            key={i}
            className="h-24 rounded-xl bg-[oklch(0.18_0.01_285)]"
          />
        ))}
      </div>
    );
  }

  const totalPosts = stats ? Number(stats.totalPosts) : 0;
  const totalComments = stats ? Number(stats.totalComments) : 0;
  const dailyCounts = stats?.dailyPostCounts ?? [];
  const maxCount = Math.max(...dailyCounts.map(Number), 1);

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-2 gap-3">
        <div className="glass-card rounded-xl p-4">
          <p className="text-xs text-[oklch(0.5_0.01_285)] mb-1">Total Posts</p>
          <p className="font-display font-bold text-[oklch(0.94_0.005_285)] text-2xl">
            {totalPosts.toLocaleString()}
          </p>
        </div>
        <div className="glass-card rounded-xl p-4">
          <p className="text-xs text-[oklch(0.5_0.01_285)] mb-1">
            Total Comments
          </p>
          <p className="font-display font-bold text-[oklch(0.94_0.005_285)] text-2xl">
            {totalComments.toLocaleString()}
          </p>
        </div>
        <div className="glass-card rounded-xl p-4">
          <p className="text-xs text-[oklch(0.5_0.01_285)] mb-1">
            Activity Ratio
          </p>
          <p className="font-display font-bold text-[oklch(0.94_0.005_285)] text-2xl">
            {totalPosts > 0 ? (totalComments / totalPosts).toFixed(1) : "0"}x
          </p>
          <p className="text-[10px] text-[oklch(0.42_0.01_285)]">
            comments/post
          </p>
        </div>
        <div className="glass-card rounded-xl p-4">
          <p className="text-xs text-[oklch(0.5_0.01_285)] mb-1">
            Est. Active Users
          </p>
          <p className="font-display font-bold text-[oklch(0.94_0.005_285)] text-2xl">
            {Math.max(totalPosts + totalComments, 0) > 0 ? "Active" : "—"}
          </p>
        </div>
      </div>

      {dailyCounts.length > 0 && (
        <div className="glass-card rounded-xl p-4">
          <p className="text-xs font-semibold text-[oklch(0.6_0.01_285)] uppercase tracking-wider mb-3">
            Daily Posts (Last {dailyCounts.length} days)
          </p>
          <div className="flex items-end gap-1 h-20">
            {dailyCounts.map((count, dayIdx) => {
              const val = Number(count);
              const pct = (val / maxCount) * 100;
              const stableKey = `d${dailyCounts.length}p${dayIdx}`;
              return (
                <div
                  key={stableKey}
                  className="flex-1 flex flex-col items-center gap-1"
                  title={`Day ${dayIdx + 1}: ${val} posts`}
                >
                  <div
                    className="w-full rounded-sm bg-[oklch(0.65_0.22_285/0.6)] transition-all"
                    style={{ height: `${Math.max(pct, 4)}%`, minHeight: "2px" }}
                  />
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Posts Tab ──────────────────────────────────────────────────────────────

function PostsTab() {
  const navigate = useNavigate();
  const { data: postsPage, isLoading } = useGetPosts(
    PostTab.latest,
    null,
    BigInt(0),
    BigInt(20),
  );
  const deletePost = useAdminDeletePost();
  const [deletingIds, setDeletingIds] = useState<Set<string>>(new Set());

  const posts = postsPage?.posts ?? [];

  const handleDelete = async (id: bigint) => {
    const key = String(id);
    setDeletingIds((prev) => new Set(prev).add(key));
    try {
      const ok = await deletePost.mutateAsync(id);
      if (ok) {
        toast.success("Post deleted.", toastSuccess());
      } else {
        toast.error("Failed to delete post.", toastError());
      }
    } catch {
      toast.error("Could not delete post. Please try again.", toastError());
    } finally {
      setDeletingIds((prev) => {
        const next = new Set(prev);
        next.delete(key);
        return next;
      });
    }
  };

  if (isLoading) {
    return (
      <div
        className="flex flex-col gap-2"
        data-ocid="admin.posts.loading_state"
      >
        {[1, 2, 3].map((i) => (
          <Skeleton
            key={i}
            className="h-16 rounded-xl bg-[oklch(0.18_0.01_285)]"
          />
        ))}
      </div>
    );
  }

  if (posts.length === 0) {
    return (
      <p
        className="text-center text-[oklch(0.45_0.01_285)] py-10"
        data-ocid="admin.posts.empty_state"
      >
        No posts found.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      {posts.map((post, i) => (
        <div
          key={String(post.id)}
          className="glass-card rounded-xl p-3 flex items-start gap-3"
          data-ocid={`admin.post.item.${i + 1}`}
        >
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-[oklch(0.88_0.005_285)] truncate">
              {post.title}
            </p>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-[10px] text-[oklch(0.45_0.01_285)]">
                {relativeTime(post.timestamp)}
              </span>
              <span className="text-[10px] text-[oklch(0.45_0.01_285)]">·</span>
              <span className="text-[10px] text-[oklch(0.45_0.01_285)]">
                {Number(post.upvotes)} upvotes
              </span>
              <span className="text-[10px] text-[oklch(0.45_0.01_285)]">·</span>
              <span className="text-[10px] text-[oklch(0.45_0.01_285)]">
                {Number(post.commentCount)} comments
              </span>
            </div>
          </div>
          <div className="flex gap-1 shrink-0">
            <button
              type="button"
              onClick={() =>
                navigate({ to: "/post/$id", params: { id: String(post.id) } })
              }
              className="w-8 h-8 rounded-lg flex items-center justify-center text-[oklch(0.5_0.01_285)] hover:text-[oklch(0.7_0.01_285)] hover:bg-[oklch(0.22_0.01_285)] transition-colors"
              aria-label="View post"
            >
              <Eye size={14} />
            </button>
            <button
              type="button"
              onClick={() => handleDelete(post.id)}
              disabled={deletingIds.has(String(post.id))}
              className="w-8 h-8 rounded-lg flex items-center justify-center text-[oklch(0.5_0.01_285)] hover:text-[oklch(0.62_0.22_22)] hover:bg-[oklch(0.62_0.22_22/0.1)] transition-colors"
              aria-label="Delete post"
              data-ocid={`admin.post.delete_button.${i + 1}`}
            >
              {deletingIds.has(String(post.id)) ? (
                <Loader2 size={14} className="animate-spin" />
              ) : (
                <Trash2 size={14} />
              )}
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Comments Tab: expanded view per post ───────────────────────────────────

function PostCommentsList({
  postId,
  postTitle,
}: { postId: PostId; postTitle: string }) {
  const [expanded, setExpanded] = useState(false);
  const { data: comments, isLoading } = useGetComments(postId);
  const deleteComment = useAdminDeleteComment();
  const [deletingIds, setDeletingIds] = useState<Set<string>>(new Set());

  const handleDelete = async (commentId: bigint) => {
    const key = String(commentId);
    setDeletingIds((prev) => new Set(prev).add(key));
    try {
      const ok = await deleteComment.mutateAsync(commentId);
      if (ok) {
        toast.success("Comment deleted.", toastSuccess());
      } else {
        toast.error("Failed to delete comment.", toastError());
      }
    } catch {
      toast.error("Could not delete comment. Please try again.", toastError());
    } finally {
      setDeletingIds((prev) => {
        const next = new Set(prev);
        next.delete(key);
        return next;
      });
    }
  };

  const count = comments?.length ?? 0;

  return (
    <div className="glass-card rounded-xl overflow-hidden">
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className="w-full px-4 py-3 flex items-center gap-3 text-left hover:bg-[oklch(0.18_0.01_285/0.5)] transition-colors"
      >
        {expanded ? (
          <ChevronDown
            size={14}
            className="text-[oklch(0.5_0.01_285)] shrink-0"
          />
        ) : (
          <ChevronRight
            size={14}
            className="text-[oklch(0.5_0.01_285)] shrink-0"
          />
        )}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-[oklch(0.88_0.005_285)] truncate">
            {postTitle}
          </p>
          <p className="text-[10px] text-[oklch(0.5_0.01_285)]">
            {count} comment{count !== 1 ? "s" : ""}
          </p>
        </div>
      </button>

      {expanded && (
        <div className="border-t border-[oklch(0.2_0.01_285)]">
          {isLoading ? (
            <div className="px-4 py-3">
              <Skeleton className="h-10 rounded bg-[oklch(0.18_0.01_285)]" />
            </div>
          ) : count === 0 ? (
            <p className="px-4 py-3 text-xs text-[oklch(0.45_0.01_285)]">
              No comments yet.
            </p>
          ) : (
            <div className="divide-y divide-[oklch(0.18_0.01_285)]">
              {(comments ?? []).map((comment, ci) => (
                <div
                  key={String(comment.id)}
                  className="px-4 py-3 flex items-start gap-3"
                  data-ocid={`admin.comment.item.${ci + 1}`}
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-[oklch(0.78_0.005_285)] leading-relaxed line-clamp-2">
                      {comment.content}
                    </p>
                    <p className="text-[10px] text-[oklch(0.42_0.01_285)] mt-0.5">
                      {relativeTime(comment.timestamp)}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleDelete(comment.id)}
                    disabled={deletingIds.has(String(comment.id))}
                    className="w-8 h-8 shrink-0 rounded-lg flex items-center justify-center text-[oklch(0.5_0.01_285)] hover:text-[oklch(0.62_0.22_22)] hover:bg-[oklch(0.62_0.22_22/0.1)] transition-colors"
                    aria-label="Delete comment"
                    data-ocid={`admin.comment.delete_button.${ci + 1}`}
                  >
                    {deletingIds.has(String(comment.id)) ? (
                      <Loader2 size={14} className="animate-spin" />
                    ) : (
                      <Trash2 size={14} />
                    )}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function CommentsTab() {
  const { data: postsPage, isLoading } = useGetPosts(
    PostTab.latest,
    null,
    BigInt(0),
    BigInt(20),
  );
  const posts = (postsPage?.posts ?? []).filter(
    (p) => Number(p.commentCount) > 0,
  );

  if (isLoading) {
    return (
      <div
        className="flex flex-col gap-2"
        data-ocid="admin.comments.loading_state"
      >
        {[1, 2, 3].map((i) => (
          <Skeleton
            key={i}
            className="h-16 rounded-xl bg-[oklch(0.18_0.01_285)]"
          />
        ))}
      </div>
    );
  }

  if (posts.length === 0) {
    return (
      <p
        className="text-center text-[oklch(0.45_0.01_285)] py-10"
        data-ocid="admin.comments.empty_state"
      >
        No posts with comments yet.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      {posts.map((post) => (
        <PostCommentsList
          key={String(post.id)}
          postId={post.id}
          postTitle={post.title}
        />
      ))}
    </div>
  );
}

// ── Categories Tab ─────────────────────────────────────────────────────────

const DEFAULT_CATEGORIES = [
  "Career",
  "Workplace",
  "Startup",
  "Manufacturing",
  "Confessions",
  "Advice",
];

function CategoriesTab() {
  const [newCat, setNewCat] = useState("");
  const [isSeeding, setIsSeeding] = useState(false);
  const { data: categories, isLoading } = useAdminGetCategories();
  const addCategory = useAdminAddCategory();
  const removeCategory = useAdminRemoveCategory();

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCat.trim()) return;
    try {
      const ok = await addCategory.mutateAsync(newCat.trim());
      if (ok) {
        setNewCat("");
        toast.success(`Category "${newCat.trim()}" added.`, toastSuccess());
      } else {
        toast.error("Failed to add category.", toastError());
      }
    } catch {
      toast.error("Could not add category. Please try again.", toastError());
    }
  };

  const handleRemove = async (id: bigint, name: string) => {
    try {
      const ok = await removeCategory.mutateAsync(id);
      if (ok) {
        toast.success(`Category "${name}" removed.`, toastSuccess());
      } else {
        toast.error(`Failed to remove category "${name}".`, toastError());
      }
    } catch {
      toast.error("Could not remove category. Please try again.", toastError());
    }
  };

  const handleSeedDefaults = async () => {
    setIsSeeding(true);
    try {
      const existingNames = new Set(
        (categories ?? []).map((c) => c.name.toLowerCase()),
      );
      let added = 0;
      for (const name of DEFAULT_CATEGORIES) {
        if (!existingNames.has(name.toLowerCase())) {
          try {
            const ok = await addCategory.mutateAsync(name);
            if (ok) added++;
          } catch {
            // Continue seeding remaining categories even if one fails
          }
        }
      }
      if (added > 0) {
        toast.success(`Added ${added} default categories.`, toastSuccess());
      } else {
        toast.success("All default categories already exist.", toastSuccess());
      }
    } finally {
      setIsSeeding(false);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <form onSubmit={handleAdd} className="flex gap-2">
        <Input
          value={newCat}
          onChange={(e) => setNewCat(e.target.value)}
          placeholder="New category name"
          className="flex-1 bg-[oklch(0.16_0.008_285)] border-[oklch(0.28_0.015_285)] text-[oklch(0.94_0.005_285)] placeholder:text-[oklch(0.38_0.01_285)] focus-visible:ring-[oklch(0.65_0.22_285/0.5)] min-h-[44px]"
          data-ocid="admin.category.input"
          maxLength={50}
        />
        <Button
          type="submit"
          disabled={addCategory.isPending || isSeeding || !newCat.trim()}
          className="shrink-0 min-h-[44px] px-4 bg-[oklch(0.65_0.22_285)] hover:bg-[oklch(0.70_0.22_285)] text-white rounded-xl disabled:opacity-50"
          data-ocid="admin.category.button"
        >
          {addCategory.isPending ? (
            <Loader2 size={16} className="animate-spin" />
          ) : (
            <Plus size={16} />
          )}
        </Button>
      </form>

      {isLoading ? (
        <div
          className="flex flex-col gap-2"
          data-ocid="admin.categories.loading_state"
        >
          {[1, 2, 3].map((i) => (
            <Skeleton
              key={i}
              className="h-12 rounded-xl bg-[oklch(0.18_0.01_285)]"
            />
          ))}
        </div>
      ) : !categories || categories.length === 0 ? (
        <div
          className="flex flex-col items-center gap-3 py-6 text-center"
          data-ocid="admin.categories.empty_state"
        >
          <p className="text-[oklch(0.45_0.01_285)] text-sm">
            No categories yet. Add one above or seed the defaults.
          </p>
          <Button
            type="button"
            onClick={handleSeedDefaults}
            disabled={isSeeding}
            className="text-xs min-h-[36px] px-4 bg-[oklch(0.65_0.22_285/0.15)] hover:bg-[oklch(0.65_0.22_285/0.25)] text-[oklch(0.75_0.22_285)] border border-[oklch(0.65_0.22_285/0.3)] rounded-xl"
            data-ocid="admin.category.seed_button"
          >
            {isSeeding ? (
              <Loader2 size={14} className="animate-spin mr-1.5" />
            ) : null}
            Seed Default Categories
          </Button>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {categories.map((cat, i) => (
            <div
              key={String(cat.id)}
              className="glass-card rounded-xl px-4 py-3 flex items-center justify-between"
              data-ocid={`admin.category.item.${i + 1}`}
            >
              <div className="flex items-center gap-2">
                <span
                  className={`w-2 h-2 rounded-full ${cat.isActive ? "bg-[oklch(0.68_0.18_160)]" : "bg-[oklch(0.4_0.01_285)]"}`}
                />
                <span className="text-sm font-medium text-[oklch(0.88_0.005_285)]">
                  {cat.name}
                </span>
                {!cat.isActive && (
                  <span className="text-[10px] text-[oklch(0.42_0.01_285)] border border-[oklch(0.28_0.01_285)] rounded px-1">
                    inactive
                  </span>
                )}
              </div>
              <button
                type="button"
                onClick={() => handleRemove(cat.id, cat.name)}
                disabled={removeCategory.isPending}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-[oklch(0.45_0.01_285)] hover:text-[oklch(0.62_0.22_22)] hover:bg-[oklch(0.62_0.22_22/0.1)] transition-colors"
                aria-label={`Remove category ${cat.name}`}
                data-ocid={`admin.category.delete_button.${i + 1}`}
              >
                {removeCategory.isPending ? (
                  <Loader2 size={14} className="animate-spin" />
                ) : (
                  <X size={14} />
                )}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Banned IPs Tab ─────────────────────────────────────────────────────────

function BannedIpsTab() {
  const { data: bannedIps, isLoading } = useAdminGetBannedIps();
  const unbanIp = useAdminUnbanIp();
  const [unbanningIds, setUnbanningIds] = useState<Set<string>>(new Set());

  const handleUnban = async (ipHash: string) => {
    setUnbanningIds((prev) => new Set(prev).add(ipHash));
    try {
      const ok = await unbanIp.mutateAsync(ipHash);
      if (ok) {
        toast.success("IP unbanned.", toastSuccess());
      } else {
        toast.error("Failed to unban IP.", toastError());
      }
    } catch {
      toast.error("Could not unban IP. Please try again.", toastError());
    } finally {
      setUnbanningIds((prev) => {
        const next = new Set(prev);
        next.delete(ipHash);
        return next;
      });
    }
  };

  if (isLoading) {
    return (
      <div
        className="flex flex-col gap-2"
        data-ocid="admin.banned.loading_state"
      >
        <Skeleton className="h-12 rounded-xl bg-[oklch(0.18_0.01_285)]" />
      </div>
    );
  }

  if (!bannedIps || bannedIps.length === 0) {
    return (
      <p
        className="text-center text-[oklch(0.45_0.01_285)] py-10"
        data-ocid="admin.banned.empty_state"
      >
        No banned IPs.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      {bannedIps.map((ip, i) => (
        <div
          key={ip}
          className="glass-card rounded-xl px-4 py-3 flex items-center justify-between"
          data-ocid={`admin.banned.item.${i + 1}`}
        >
          <div className="flex items-center gap-2 min-w-0">
            <Ban size={14} className="text-[oklch(0.62_0.22_22)] shrink-0" />
            <span className="text-sm font-mono text-[oklch(0.7_0.01_285)] truncate">
              {ip.slice(0, 20)}…
            </span>
          </div>
          <button
            type="button"
            onClick={() => handleUnban(ip)}
            disabled={unbanningIds.has(ip)}
            className="shrink-0 text-xs px-3 py-1.5 rounded-lg border border-[oklch(0.68_0.18_160/0.4)] text-[oklch(0.68_0.18_160)] hover:bg-[oklch(0.68_0.18_160/0.1)] transition-colors min-h-[32px]"
            data-ocid={`admin.banned.button.${i + 1}`}
          >
            {unbanningIds.has(ip) ? (
              <Loader2 size={12} className="animate-spin" />
            ) : (
              "Unban"
            )}
          </button>
        </div>
      ))}
    </div>
  );
}

// ── Keywords Tab ───────────────────────────────────────────────────────────

function KeywordsTab() {
  const [newKeyword, setNewKeyword] = useState("");
  const { data: keywords, isLoading } = useAdminGetBlockedKeywords();
  const addKeyword = useAdminAddKeyword();
  const removeKeyword = useAdminRemoveKeyword();

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newKeyword.trim()) return;
    try {
      const ok = await addKeyword.mutateAsync(newKeyword.trim().toLowerCase());
      if (ok) {
        setNewKeyword("");
        toast.success(
          `Keyword "${newKeyword.trim()}" blocked.`,
          toastSuccess(),
        );
      } else {
        toast.error("Failed to add keyword.", toastError());
      }
    } catch {
      toast.error("Could not add keyword. Please try again.", toastError());
    }
  };

  const handleRemove = async (keyword: string) => {
    try {
      const ok = await removeKeyword.mutateAsync(keyword);
      if (ok) {
        toast.success(`Keyword "${keyword}" unblocked.`, toastSuccess());
      } else {
        toast.error(`Failed to remove keyword "${keyword}".`, toastError());
      }
    } catch {
      toast.error("Could not remove keyword. Please try again.", toastError());
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <form onSubmit={handleAdd} className="flex gap-2">
        <Input
          value={newKeyword}
          onChange={(e) => setNewKeyword(e.target.value)}
          placeholder="Add blocked keyword"
          className="flex-1 bg-[oklch(0.16_0.008_285)] border-[oklch(0.28_0.015_285)] text-[oklch(0.94_0.005_285)] placeholder:text-[oklch(0.38_0.01_285)] focus-visible:ring-[oklch(0.65_0.22_285/0.5)] min-h-[44px]"
          data-ocid="admin.keyword.input"
          maxLength={100}
        />
        <Button
          type="submit"
          disabled={addKeyword.isPending || !newKeyword.trim()}
          className="shrink-0 min-h-[44px] px-4 bg-[oklch(0.65_0.22_285)] hover:bg-[oklch(0.70_0.22_285)] text-white rounded-xl disabled:opacity-50"
          data-ocid="admin.keyword.button"
        >
          {addKeyword.isPending ? (
            <Loader2 size={16} className="animate-spin" />
          ) : (
            <Plus size={16} />
          )}
        </Button>
      </form>

      {isLoading ? (
        <div
          className="flex flex-col gap-2"
          data-ocid="admin.keywords.loading_state"
        >
          <Skeleton className="h-10 rounded-xl bg-[oklch(0.18_0.01_285)]" />
        </div>
      ) : !keywords || keywords.length === 0 ? (
        <p
          className="text-center text-[oklch(0.45_0.01_285)] py-6"
          data-ocid="admin.keywords.empty_state"
        >
          No blocked keywords.
        </p>
      ) : (
        <div className="flex flex-wrap gap-2">
          {keywords.map((kw, i) => (
            <div
              key={kw}
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-[oklch(0.62_0.22_22/0.1)] border border-[oklch(0.62_0.22_22/0.3)] text-sm text-[oklch(0.75_0.15_22)]"
              data-ocid={`admin.keyword.item.${i + 1}`}
            >
              <span>{kw}</span>
              <button
                type="button"
                onClick={() => handleRemove(kw)}
                disabled={removeKeyword.isPending}
                className="ml-1 text-[oklch(0.55_0.15_22)] hover:text-[oklch(0.75_0.22_22)] transition-colors"
                aria-label={`Remove keyword ${kw}`}
                data-ocid={`admin.keyword.delete_button.${i + 1}`}
              >
                <X size={12} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Tab config ─────────────────────────────────────────────────────────────

const TABS = [
  {
    id: "overview",
    label: "Overview",
    icon: BarChart3,
    ocid: "admin.overview.tab",
  },
  { id: "posts", label: "Posts", icon: FileText, ocid: "admin.posts.tab" },
  {
    id: "comments",
    label: "Comments",
    icon: MessageSquare,
    ocid: "admin.comments.tab",
  },
  {
    id: "categories",
    label: "Categories",
    icon: Tag,
    ocid: "admin.categories.tab",
  },
  { id: "banned", label: "Banned IPs", icon: Ban, ocid: "admin.banned.tab" },
  {
    id: "keywords",
    label: "Keywords",
    icon: KeyRound,
    ocid: "admin.keywords.tab",
  },
] as const;

type TabId = (typeof TABS)[number]["id"];

// ── Main Admin Dashboard ───────────────────────────────────────────────────

export function AdminPage() {
  const navigate = useNavigate();
  const [isAuthed, setIsAuthed] = useState(() => {
    try {
      return sessionStorage.getItem(ADMIN_STORAGE_KEY) === "true";
    } catch {
      return false;
    }
  });
  const [activeTab, setActiveTab] = useState<TabId>("overview");
  const tabScrollRef = useRef<HTMLDivElement>(null);

  if (!isAuthed) {
    return <AdminGate onAuth={() => setIsAuthed(true)} />;
  }

  const renderTabContent = () => {
    switch (activeTab) {
      case "overview":
        return <OverviewTab />;
      case "posts":
        return <PostsTab />;
      case "comments":
        return <CommentsTab />;
      case "categories":
        return <CategoriesTab />;
      case "banned":
        return <BannedIpsTab />;
      case "keywords":
        return <KeywordsTab />;
    }
  };

  return (
    <div className="min-h-screen bg-[oklch(0.1_0.005_285)]">
      <header className="sticky top-0 z-30 bg-[oklch(0.1_0.005_285/0.95)] backdrop-blur-md border-b border-[oklch(0.22_0.012_285)]">
        <div className="max-w-[480px] mx-auto px-4 py-3 flex items-center gap-3">
          <button
            type="button"
            onClick={() => navigate({ to: "/", search: { tab: "trending" } })}
            className="w-9 h-9 rounded-xl bg-[oklch(0.18_0.01_285)] border border-[oklch(0.25_0.015_285)] flex items-center justify-center text-[oklch(0.7_0.01_285)] hover:text-[oklch(0.9_0.01_285)] transition-colors shrink-0"
            aria-label="Back to home"
          >
            <ArrowLeft size={16} />
          </button>
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <ShieldCheck
              size={18}
              className="text-[oklch(0.65_0.22_285)] shrink-0"
            />
            <span className="font-display font-bold text-[oklch(0.88_0.005_285)] truncate">
              Admin Dashboard
            </span>
          </div>
          <button
            type="button"
            onClick={() => {
              sessionStorage.removeItem(ADMIN_STORAGE_KEY);
              setIsAuthed(false);
            }}
            className="text-xs text-[oklch(0.45_0.01_285)] hover:text-[oklch(0.62_0.22_22)] transition-colors shrink-0 min-h-[36px] px-2"
          >
            Sign out
          </button>
        </div>

        <div
          ref={tabScrollRef}
          className="chips-scroll scrollbar-hide px-4 pb-3 max-w-[480px] mx-auto"
        >
          <div className="flex gap-1.5 w-max">
            {TABS.map(({ id, label, icon: Icon, ocid }) => (
              <button
                type="button"
                key={id}
                onClick={() => setActiveTab(id)}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-full whitespace-nowrap transition-all min-h-[32px] ${
                  activeTab === id
                    ? "bg-[oklch(0.65_0.22_285)] text-white shadow-glow-sm"
                    : "bg-[oklch(0.16_0.008_285)] text-[oklch(0.55_0.01_285)] border border-[oklch(0.22_0.01_285)] hover:border-[oklch(0.35_0.015_285)]"
                }`}
                data-ocid={ocid}
                aria-pressed={activeTab === id}
              >
                <Icon size={12} />
                {label}
              </button>
            ))}
          </div>
        </div>
      </header>

      <main className="max-w-[480px] mx-auto px-4 pt-4 pb-safe">
        {renderTabContent()}
      </main>
    </div>
  );
}

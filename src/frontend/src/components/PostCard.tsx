import { useNavigate } from "@tanstack/react-router";
import { ArrowUp, MessageCircle } from "lucide-react";
import type { Category, Post } from "../backend.d";
import { getCategoryColor } from "../utils/categories";
import { relativeTime } from "../utils/time";
import { hasUpvotedPost } from "../utils/upvoteStore";
import { CategoryBadge } from "./CategoryBadge";

interface PostCardProps {
  post: Post;
  categories: Category[];
  index: number;
  onUpvote?: (postId: bigint) => void;
  isUpvoting?: boolean;
}

// Map category index to a left-stripe accent color (hue only, no full OKLCH class)
const STRIPE_HUES = [285, 225, 160, 55, 22, 320, 200, 270];

export function PostCard({
  post,
  categories,
  index,
  onUpvote,
  isUpvoting,
}: PostCardProps) {
  const navigate = useNavigate();
  const category =
    post.category !== undefined
      ? categories.find((c) => c.id === post.category)
      : undefined;
  const catIndex = category
    ? categories.findIndex((c) => c.id === category.id)
    : 0;
  const upvoted = hasUpvotedPost(post.id);

  // Pick stripe hue based on category index, fallback to indigo
  const stripeHue = STRIPE_HUES[catIndex % STRIPE_HUES.length];
  const stripeColor = `oklch(0.58 0.18 ${stripeHue})`;

  // Category color for upvote active state
  const catColors = category ? getCategoryColor(category.name, catIndex) : null;
  void catColors; // used below via inline style

  const handleUpvote = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isUpvoting && !upvoted) {
      onUpvote?.(post.id);
    }
  };

  const handleClick = () => {
    navigate({ to: "/post/$id", params: { id: String(post.id) } });
  };

  return (
    <article
      className="post-card relative overflow-hidden rounded-xl cursor-pointer transition-all duration-150"
      style={{
        background: "oklch(0.16 0.01 285)",
        border: "1px solid oklch(0.24 0.013 285)",
      }}
      onClick={handleClick}
      data-ocid={`home.post.item.${index}`}
      onKeyDown={(e) => e.key === "Enter" && handleClick()}
      aria-label={`Post: ${post.title}`}
    >
      {/* Left category accent stripe */}
      <div
        className="absolute left-0 top-0 bottom-0 w-[3px] rounded-l-xl"
        style={{ background: stripeColor }}
        aria-hidden="true"
      />

      {/* Hover/active overlay — separate layer so stripe stays visible */}
      <div
        className="absolute inset-0 opacity-0 hover:opacity-100 active:opacity-100 transition-opacity duration-150 pointer-events-none rounded-xl"
        style={{ background: "oklch(0.19 0.012 285 / 0.6)" }}
        aria-hidden="true"
      />

      {/* Content — padded to clear the stripe */}
      <div className="relative pl-5 pr-4 pt-3.5 pb-3">
        {/* Category + timestamp row */}
        <div className="flex items-center justify-between mb-2 gap-2">
          {category ? (
            <CategoryBadge category={category} index={catIndex} />
          ) : (
            <span className="inline-flex items-center px-2 py-0.5 text-xs font-medium rounded border bg-[oklch(0.2_0.01_285/0.15)] text-[oklch(0.5_0.01_285)] border-[oklch(0.25_0.01_285/0.25)]">
              General
            </span>
          )}
          <span className="text-[11px] text-[oklch(0.46_0.01_285)] tabular-nums shrink-0">
            {relativeTime(post.timestamp)}
          </span>
        </div>

        {/* Title — high contrast, tight leading */}
        <h3 className="font-display font-semibold text-[oklch(0.96_0.005_285)] text-[15px] leading-[1.35] mb-1.5 line-clamp-2 tracking-[-0.01em]">
          {post.title}
        </h3>

        {/* Content preview — slightly brighter than before, with bottom fade */}
        <div className="relative mb-3">
          <p className="text-[13px] text-[oklch(0.62_0.007_285)] leading-relaxed line-clamp-2">
            {post.content}
          </p>
        </div>

        {/* Footer stats */}
        <div className="flex items-center gap-1">
          <button
            type="button"
            className={`flex items-center gap-1.5 text-[13px] font-semibold min-h-[34px] px-2.5 rounded-lg transition-all duration-100 ${
              upvoted
                ? "text-[oklch(0.78_0.22_285)] bg-[oklch(0.65_0.22_285/0.14)]"
                : "text-[oklch(0.5_0.01_285)] hover:text-[oklch(0.78_0.22_285)] hover:bg-[oklch(0.65_0.22_285/0.1)] active:scale-95"
            }`}
            onClick={handleUpvote}
            disabled={upvoted || isUpvoting}
            aria-label={`Upvote, ${Number(post.upvotes)} votes`}
          >
            <ArrowUp
              size={13}
              strokeWidth={upvoted ? 2.8 : 2}
              className="transition-transform"
            />
            <span className="tabular-nums">{Number(post.upvotes)}</span>
          </button>

          <span className="text-[oklch(0.28_0.01_285)] select-none mx-0.5">
            ·
          </span>

          <div className="flex items-center gap-1.5 text-[13px] text-[oklch(0.46_0.01_285)]">
            <MessageCircle size={13} strokeWidth={1.6} />
            <span className="tabular-nums">{Number(post.commentCount)}</span>
          </div>
        </div>
      </div>
    </article>
  );
}

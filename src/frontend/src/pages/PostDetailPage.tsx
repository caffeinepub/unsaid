import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { useNavigate, useParams } from "@tanstack/react-router";
import {
  ArrowLeft,
  ArrowUp,
  Ghost,
  Loader2,
  MessageCircle,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { CreateCommentError } from "../backend.d";
import type { Comment } from "../backend.d";
import { BottomNav } from "../components/BottomNav";
import { useActor } from "../hooks/useActor";
import {
  useCreateComment,
  useGetAnonymousId,
  useGetPost,
  useUpvoteComment,
  useUpvotePost,
} from "../hooks/useQueries";
import { getCategoryColor } from "../utils/categories";
import { getDeviceId } from "../utils/fingerprint";
import { formatDate, relativeTime } from "../utils/time";
import { hasUpvotedComment, hasUpvotedPost } from "../utils/upvoteStore";

// Component to show the anonymous ID for a comment
function CommentAnonymousLabel({
  ipHash,
  postId,
}: { ipHash: string; postId: bigint }) {
  const { actor, isFetching } = useActor();
  const [anonId, setAnonId] = useState<bigint | null>(null);

  useEffect(() => {
    if (!actor || isFetching) return;
    actor
      .getAnonymousId(ipHash, postId)
      .then(setAnonId)
      .catch(() => null);
  }, [actor, isFetching, ipHash, postId]);

  if (anonId === null)
    return (
      <span className="text-[oklch(0.45_0.01_285)] text-xs">Anonymous...</span>
    );
  return (
    <span className="text-[oklch(0.65_0.22_285)] text-xs font-semibold">
      Anonymous #{String(anonId).padStart(4, "0")}
    </span>
  );
}

// Individual comment component
function CommentItem({
  comment,
  postId,
  index,
}: {
  comment: Comment;
  postId: bigint;
  index: number;
}) {
  const upvoteComment = useUpvoteComment();
  const upvoted = hasUpvotedComment(comment.id);
  const [localCount, setLocalCount] = useState(Number(comment.upvotes));
  const [localUpvoted, setLocalUpvoted] = useState(upvoted);

  const handleUpvote = () => {
    if (localUpvoted) return;
    setLocalUpvoted(true);
    setLocalCount((c) => c + 1);
    upvoteComment.mutate({ commentId: comment.id, postId });
  };

  return (
    <div
      className="py-3 border-b border-[oklch(0.2_0.01_285)] last:border-0"
      data-ocid={`post.comment.item.${index}`}
    >
      <div className="flex items-center justify-between mb-1.5">
        <CommentAnonymousLabel ipHash={comment.ipHash} postId={postId} />
        <span
          className="text-[10px] text-[oklch(0.4_0.01_285)]"
          title={formatDate(comment.timestamp)}
        >
          {relativeTime(comment.timestamp)}
        </span>
      </div>
      <p className="text-sm text-[oklch(0.8_0.005_285)] leading-relaxed mb-2">
        {comment.content}
      </p>
      <button
        type="button"
        onClick={handleUpvote}
        disabled={localUpvoted}
        className={`flex items-center gap-1 text-xs transition-colors min-h-[32px] px-1.5 rounded-lg ${
          localUpvoted
            ? "text-[oklch(0.75_0.22_285)] bg-[oklch(0.65_0.22_285/0.1)]"
            : "text-[oklch(0.45_0.01_285)] hover:text-[oklch(0.65_0.22_285)]"
        }`}
        aria-label={`Upvote comment, ${localCount} votes`}
      >
        <ArrowUp size={12} strokeWidth={localUpvoted ? 2.5 : 2} />
        <span>{localCount}</span>
      </button>
    </div>
  );
}

export function PostDetailPage() {
  const { id } = useParams({ from: "/post/$id" });
  const navigate = useNavigate();
  const postId = BigInt(id);
  const deviceId = getDeviceId();

  const { data: postWithComments, isLoading, error } = useGetPost(postId);
  const { data: anonIdData } = useGetAnonymousId(deviceId, postId);
  const upvotePost = useUpvotePost();
  const createComment = useCreateComment();

  const [commentText, setCommentText] = useState("");
  const [postUpvoted, setPostUpvoted] = useState(() => hasUpvotedPost(postId));
  const [localUpvotes, setLocalUpvotes] = useState<number | null>(null);
  const commentInputRef = useRef<HTMLTextAreaElement>(null);

  const post = postWithComments?.post;
  const comments = postWithComments?.comments ?? [];

  useEffect(() => {
    if (post) {
      setLocalUpvotes(Number(post.upvotes));
    }
  }, [post]);

  // Find category
  const category =
    post?.category !== undefined
      ? { id: post.category, name: "", isActive: true }
      : undefined;

  const handleUpvote = () => {
    if (postUpvoted || !post) return;
    setPostUpvoted(true);
    setLocalUpvotes((c) => (c ?? 0) + 1);
    upvotePost.mutate({ postId: post.id });
  };

  const handleCommentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim()) return;

    const result = await createComment.mutateAsync({
      postId,
      content: commentText.trim(),
    });

    if (result.__kind__ === "ok") {
      setCommentText("");
      toast.success("Comment posted.", {
        style: {
          background: "oklch(0.16 0.01 285)",
          border: "1px solid oklch(0.25 0.015 285)",
          color: "oklch(0.94 0.005 285)",
        },
      });
    } else {
      const errorMessages: Record<string, string> = {
        [CreateCommentError.bannedIp]: "Your device has been restricted.",
        [CreateCommentError.contentBlocked]:
          "Your comment contains blocked content.",
        [CreateCommentError.internalError]: "Something went wrong.",
      };
      toast.error(errorMessages[result.err] ?? "Failed to post comment.", {
        style: {
          background: "oklch(0.16 0.01 285)",
          border: "1px solid oklch(0.62 0.22 22 / 0.4)",
          color: "oklch(0.94 0.005 285)",
        },
      });
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[oklch(0.1_0.005_285)]">
        <div
          className="max-w-[480px] mx-auto px-4 pt-4 pb-safe"
          data-ocid="post.loading_state"
        >
          <div className="flex items-center gap-3 mb-6">
            <Skeleton className="h-9 w-9 rounded-xl bg-[oklch(0.18_0.01_285)]" />
            <Skeleton className="h-5 w-24 rounded bg-[oklch(0.18_0.01_285)]" />
          </div>
          <Skeleton className="h-6 w-16 rounded bg-[oklch(0.18_0.01_285)] mb-3" />
          <Skeleton className="h-8 w-3/4 rounded bg-[oklch(0.2_0.01_285)] mb-2" />
          <Skeleton className="h-4 w-full rounded bg-[oklch(0.18_0.01_285)] mb-2" />
          <Skeleton className="h-4 w-5/6 rounded bg-[oklch(0.18_0.01_285)] mb-2" />
          <Skeleton className="h-4 w-2/3 rounded bg-[oklch(0.18_0.01_285)] mb-6" />
          <div className="flex gap-4">
            <Skeleton className="h-8 w-16 rounded bg-[oklch(0.18_0.01_285)]" />
            <Skeleton className="h-8 w-16 rounded bg-[oklch(0.18_0.01_285)]" />
          </div>
        </div>
        <BottomNav />
      </div>
    );
  }

  if (error || !post) {
    return (
      <div
        className="min-h-screen bg-[oklch(0.1_0.005_285)] flex flex-col items-center justify-center p-8"
        data-ocid="post.error_state"
      >
        <Ghost size={48} className="text-[oklch(0.3_0.01_285)] mb-4" />
        <p className="font-display text-[oklch(0.6_0.01_285)] text-xl mb-2">
          Post not found
        </p>
        <p className="text-sm text-[oklch(0.42_0.01_285)] mb-6">
          This post may have been deleted.
        </p>
        <Button
          onClick={() => navigate({ to: "/", search: { tab: "trending" } })}
          className="bg-[oklch(0.65_0.22_285)] hover:bg-[oklch(0.70_0.22_285)] text-white rounded-xl"
        >
          <ArrowLeft size={16} className="mr-2" />
          Back to Home
        </Button>
        <BottomNav />
      </div>
    );
  }

  // Get category color if available
  const catColors = category ? getCategoryColor("general", 0) : null;

  return (
    <div className="min-h-screen bg-[oklch(0.1_0.005_285)]">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-[oklch(0.1_0.005_285/0.95)] backdrop-blur-md border-b border-[oklch(0.22_0.012_285)]">
        <div className="max-w-[480px] mx-auto px-4 py-3 flex items-center gap-3">
          <button
            type="button"
            onClick={() => navigate({ to: "/", search: { tab: "trending" } })}
            className="w-9 h-9 rounded-xl bg-[oklch(0.18_0.01_285)] border border-[oklch(0.25_0.015_285)] flex items-center justify-center text-[oklch(0.7_0.01_285)] hover:text-[oklch(0.9_0.01_285)] hover:border-[oklch(0.35_0.015_285)] transition-colors shrink-0"
            aria-label="Back to home"
          >
            <ArrowLeft size={16} />
          </button>
          <div className="flex items-center gap-2 min-w-0">
            <MessageCircle
              size={16}
              className="text-[oklch(0.5_0.01_285)] shrink-0"
            />
            <span className="text-sm text-[oklch(0.6_0.01_285)] truncate">
              {comments.length} {comments.length === 1 ? "comment" : "comments"}
            </span>
          </div>
        </div>
      </header>

      {/* Main scrollable content */}
      <main className="max-w-[480px] mx-auto px-4 pb-[140px] pt-4">
        {/* Post */}
        <article className="glass-card rounded-xl p-4 mb-4">
          {/* Category + meta row */}
          <div className="flex items-center justify-between mb-3 gap-2">
            {post.category !== undefined ? (
              <span
                className={`inline-flex items-center px-2 py-0.5 text-xs font-medium rounded border ${catColors?.bg ?? "bg-[oklch(0.2_0.01_285/0.15)]"} ${catColors?.text ?? "text-[oklch(0.55_0.01_285)]"} ${catColors?.border ?? "border-[oklch(0.25_0.01_285/0.3)]"}`}
              >
                Category
              </span>
            ) : (
              <span className="inline-flex items-center px-2 py-0.5 text-xs font-medium rounded border bg-[oklch(0.2_0.01_285/0.15)] text-[oklch(0.55_0.01_285)] border-[oklch(0.25_0.01_285/0.3)]">
                General
              </span>
            )}
            <span
              className="text-xs text-[oklch(0.42_0.01_285)]"
              title={formatDate(post.timestamp)}
            >
              {relativeTime(post.timestamp)}
            </span>
          </div>

          {/* Author */}
          <div className="flex items-center gap-1.5 mb-2">
            <Ghost
              size={14}
              className="text-[oklch(0.55_0.01_285)]"
              strokeWidth={1.5}
            />
            <span className="text-xs font-semibold text-[oklch(0.65_0.22_285)]">
              Anonymous #
              {anonIdData !== undefined
                ? String(anonIdData).padStart(4, "0")
                : "????"}
            </span>
          </div>

          {/* Title */}
          <h1 className="font-display font-bold text-[oklch(0.94_0.005_285)] text-xl leading-snug mb-3">
            {post.title}
          </h1>

          {/* Content */}
          <p className="text-[oklch(0.78_0.006_285)] leading-relaxed text-sm whitespace-pre-wrap mb-4">
            {post.content}
          </p>

          {/* Actions */}
          <div className="flex items-center gap-4 pt-2 border-t border-[oklch(0.2_0.01_285)]">
            <button
              type="button"
              onClick={handleUpvote}
              disabled={postUpvoted}
              className={`flex items-center gap-1.5 text-sm font-medium min-h-[40px] px-3 rounded-xl transition-all ${
                postUpvoted
                  ? "text-[oklch(0.75_0.22_285)] bg-[oklch(0.65_0.22_285/0.15)] shadow-glow-sm"
                  : "text-[oklch(0.55_0.01_285)] hover:text-[oklch(0.75_0.22_285)] hover:bg-[oklch(0.65_0.22_285/0.08)]"
              }`}
              data-ocid="post.upvote.button"
              aria-label={`Upvote post, ${localUpvotes ?? Number(post.upvotes)} votes`}
            >
              <ArrowUp
                size={16}
                strokeWidth={postUpvoted ? 2.5 : 2}
                className="transition-transform"
              />
              <span>{localUpvotes ?? Number(post.upvotes)}</span>
            </button>

            <div className="flex items-center gap-1.5 text-sm text-[oklch(0.5_0.01_285)]">
              <MessageCircle size={16} strokeWidth={1.5} />
              <span>{comments.length}</span>
            </div>

            <button
              type="button"
              onClick={() => commentInputRef.current?.focus()}
              className="ml-auto text-xs text-[oklch(0.5_0.01_285)] hover:text-[oklch(0.75_0.22_285)] transition-colors min-h-[40px] px-2"
            >
              Add comment
            </button>
          </div>
        </article>

        {/* Comments section */}
        <section>
          <h2 className="font-display font-semibold text-[oklch(0.7_0.01_285)] text-sm uppercase tracking-wider mb-3">
            Comments · {comments.length}
          </h2>

          {comments.length === 0 ? (
            <div
              className="flex flex-col items-center py-10 text-center"
              data-ocid="post.comment.empty_state"
            >
              <MessageCircle
                size={32}
                className="text-[oklch(0.28_0.01_285)] mb-3"
                strokeWidth={1}
              />
              <p className="text-sm text-[oklch(0.42_0.01_285)]">
                No comments yet. Start the conversation.
              </p>
            </div>
          ) : (
            <div className="glass-card rounded-xl px-4">
              {comments.map((comment, i) => (
                <CommentItem
                  key={String(comment.id)}
                  comment={comment}
                  postId={postId}
                  index={i + 1}
                />
              ))}
            </div>
          )}
        </section>
      </main>

      {/* Sticky comment input */}
      <div className="fixed bottom-[60px] left-0 right-0 z-20 bg-[oklch(0.12_0.007_285/0.97)] backdrop-blur-md border-t border-[oklch(0.22_0.012_285)]">
        <form
          onSubmit={handleCommentSubmit}
          className="max-w-[480px] mx-auto px-4 py-3 flex gap-2 items-end"
        >
          <Textarea
            ref={commentInputRef}
            value={commentText}
            onChange={(e) => setCommentText(e.target.value.slice(0, 1000))}
            placeholder="Share your thoughts..."
            className="flex-1 bg-[oklch(0.19_0.01_285)] border-[oklch(0.28_0.015_285)] text-[oklch(0.94_0.005_285)] placeholder:text-[oklch(0.38_0.01_285)] focus-visible:ring-[oklch(0.65_0.22_285/0.5)] resize-none min-h-[44px] max-h-[120px] text-sm"
            rows={1}
            data-ocid="post.comment.input"
            aria-label="Write a comment"
          />
          <Button
            type="submit"
            disabled={createComment.isPending || !commentText.trim()}
            className="shrink-0 min-h-[44px] px-4 bg-[oklch(0.65_0.22_285)] hover:bg-[oklch(0.70_0.22_285)] text-white font-semibold rounded-xl disabled:opacity-50 transition-all"
            data-ocid="post.comment.submit_button"
          >
            {createComment.isPending ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              "Post"
            )}
          </Button>
        </form>
      </div>

      <BottomNav />
    </div>
  );
}

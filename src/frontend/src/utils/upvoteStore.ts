const UPVOTED_POSTS_KEY = "wb_upvoted_posts";
const UPVOTED_COMMENTS_KEY = "wb_upvoted_comments";

function getSet(key: string): Set<string> {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return new Set();
    const arr = JSON.parse(raw) as string[];
    return new Set(arr);
  } catch {
    return new Set();
  }
}

function saveSet(key: string, set: Set<string>): void {
  try {
    localStorage.setItem(key, JSON.stringify(Array.from(set)));
  } catch {
    // ignore
  }
}

export function hasUpvotedPost(postId: bigint): boolean {
  return getSet(UPVOTED_POSTS_KEY).has(String(postId));
}

export function markPostUpvoted(postId: bigint): void {
  const set = getSet(UPVOTED_POSTS_KEY);
  set.add(String(postId));
  saveSet(UPVOTED_POSTS_KEY, set);
}

export function hasUpvotedComment(commentId: bigint): boolean {
  return getSet(UPVOTED_COMMENTS_KEY).has(String(commentId));
}

export function markCommentUpvoted(commentId: bigint): void {
  const set = getSet(UPVOTED_COMMENTS_KEY);
  set.add(String(commentId));
  saveSet(UPVOTED_COMMENTS_KEY, set);
}

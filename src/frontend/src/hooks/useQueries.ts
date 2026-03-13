import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { PostTab } from "../backend.d";
import type { CategoryId, CommentId, IpHash, PostId } from "../backend.d";
import { getDeviceId } from "../utils/fingerprint";
import { markCommentUpvoted, markPostUpvoted } from "../utils/upvoteStore";
import { useActor } from "./useActor";

const ADMIN_PASSWORD = "whisper2024";

// ── Posts ──────────────────────────────────────────────────────────────────

export function useGetPosts(
  tab: PostTab,
  category: CategoryId | null,
  page: bigint,
  pageSize: bigint,
) {
  const { actor, isFetching } = useActor();
  return useQuery({
    queryKey: ["posts", tab, String(category), String(page), String(pageSize)],
    queryFn: async () => {
      if (!actor) throw new Error("Actor not ready");
      return actor.getPosts(tab, category, page, pageSize);
    },
    enabled: !!actor && !isFetching,
    staleTime: 30_000,
  });
}

export function useGetPost(id: PostId) {
  const { actor, isFetching } = useActor();
  return useQuery({
    queryKey: ["post", String(id)],
    queryFn: async () => {
      if (!actor) throw new Error("Actor not ready");
      return actor.getPost(id);
    },
    enabled: !!actor && !isFetching,
    staleTime: 15_000,
  });
}

// ── Categories ────────────────────────────────────────────────────────────

export function useGetCategories() {
  const { actor, isFetching } = useActor();
  return useQuery({
    queryKey: ["categories"],
    queryFn: async () => {
      if (!actor) throw new Error("Actor not ready");
      return actor.getCategories();
    },
    enabled: !!actor && !isFetching,
    staleTime: 60_000,
  });
}

// ── Stats ─────────────────────────────────────────────────────────────────

export function useGetStats() {
  const { actor, isFetching } = useActor();
  return useQuery({
    queryKey: ["stats"],
    queryFn: async () => {
      if (!actor) throw new Error("Actor not ready");
      return actor.getStats();
    },
    enabled: !!actor && !isFetching,
    staleTime: 60_000,
  });
}

// ── Anonymous ID ──────────────────────────────────────────────────────────

export function useGetAnonymousId(ipHash: IpHash, postId: PostId) {
  const { actor, isFetching } = useActor();
  return useQuery({
    queryKey: ["anonId", ipHash, String(postId)],
    queryFn: async () => {
      if (!actor) throw new Error("Actor not ready");
      return actor.getAnonymousId(ipHash, postId);
    },
    enabled: !!actor && !isFetching && !!ipHash,
    staleTime: Number.POSITIVE_INFINITY,
  });
}

// ── Mutations (actor-based) ───────────────────────────────────────────────

export function useCreatePost() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      title,
      content,
      category,
    }: {
      title: string;
      content: string;
      category: CategoryId | null;
    }) => {
      if (!actor) throw new Error("No actor");
      const ipHash = getDeviceId();
      return actor.createPost(title, content, category, ipHash);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["posts"] });
    },
  });
}

export function useCreateComment() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      postId,
      content,
    }: {
      postId: PostId;
      content: string;
    }) => {
      if (!actor) throw new Error("No actor");
      const ipHash = getDeviceId();
      return actor.createComment(postId, content, ipHash);
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["post", String(variables.postId)],
      });
      queryClient.invalidateQueries({ queryKey: ["posts"] });
    },
  });
}

export function useUpvotePost() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ postId }: { postId: PostId }) => {
      if (!actor) throw new Error("No actor");
      const ipHash = getDeviceId();
      const result = await actor.upvotePost(postId, ipHash);
      if (result && !result.alreadyVoted) {
        markPostUpvoted(postId);
      }
      return result;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["post", String(variables.postId)],
      });
      queryClient.invalidateQueries({ queryKey: ["posts"] });
    },
  });
}

export function useUpvoteComment() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      commentId,
      postId: _postId,
    }: { commentId: CommentId; postId: PostId }) => {
      if (!actor) throw new Error("No actor");
      const ipHash = getDeviceId();
      const result = await actor.upvoteComment(commentId, ipHash);
      if (result && !result.alreadyVoted) {
        markCommentUpvoted(commentId);
      }
      return result;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["post", String(variables.postId)],
      });
    },
  });
}

// ── Comments (for admin) ──────────────────────────────────────────────────

export function useGetComments(postId: PostId) {
  const { actor, isFetching } = useActor();
  return useQuery({
    queryKey: ["comments", String(postId)],
    queryFn: async () => {
      if (!actor) throw new Error("Actor not ready");
      return actor.getComments(postId);
    },
    enabled: !!actor && !isFetching,
    staleTime: 30_000,
  });
}

// ── Admin Queries ──────────────────────────────────────────────────────────

export function useAdminGetCategories() {
  const { actor, isFetching } = useActor();
  return useQuery({
    queryKey: ["admin", "categories"],
    queryFn: async () => {
      if (!actor) throw new Error("Actor not ready");
      return actor.adminGetCategories(ADMIN_PASSWORD);
    },
    enabled: !!actor && !isFetching,
    staleTime: 30_000,
  });
}

export function useAdminGetBannedIps() {
  const { actor, isFetching } = useActor();
  return useQuery({
    queryKey: ["admin", "bannedIps"],
    queryFn: async () => {
      if (!actor) throw new Error("Actor not ready");
      return actor.adminGetBannedIps(ADMIN_PASSWORD);
    },
    enabled: !!actor && !isFetching,
    staleTime: 30_000,
  });
}

export function useAdminGetBlockedKeywords() {
  const { actor, isFetching } = useActor();
  return useQuery({
    queryKey: ["admin", "keywords"],
    queryFn: async () => {
      if (!actor) throw new Error("Actor not ready");
      return actor.adminGetBlockedKeywords(ADMIN_PASSWORD);
    },
    enabled: !!actor && !isFetching,
    staleTime: 30_000,
  });
}

// ── Admin Mutations ────────────────────────────────────────────────────────

export function useAdminDeletePost() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: PostId) => {
      if (!actor) throw new Error("No actor");
      return actor.adminDeletePost(id, ADMIN_PASSWORD);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["posts"] });
      queryClient.invalidateQueries({ queryKey: ["admin"] });
    },
  });
}

export function useAdminDeleteComment() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: CommentId) => {
      if (!actor) throw new Error("No actor");
      return actor.adminDeleteComment(id, ADMIN_PASSWORD);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["posts"] });
      queryClient.invalidateQueries({ queryKey: ["admin"] });
      queryClient.invalidateQueries({ queryKey: ["comments"] });
    },
  });
}

export function useAdminUnbanIp() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (ipHash: IpHash) => {
      if (!actor) throw new Error("No actor");
      return actor.adminUnbanIp(ipHash, ADMIN_PASSWORD);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "bannedIps"] });
    },
  });
}

export function useAdminAddCategory() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (name: string) => {
      if (!actor) throw new Error("No actor");
      return actor.adminAddCategory(name, ADMIN_PASSWORD);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["categories"] });
      queryClient.invalidateQueries({ queryKey: ["admin", "categories"] });
    },
  });
}

export function useAdminRemoveCategory() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: CategoryId) => {
      if (!actor) throw new Error("No actor");
      return actor.adminRemoveCategory(id, ADMIN_PASSWORD);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["categories"] });
      queryClient.invalidateQueries({ queryKey: ["admin", "categories"] });
    },
  });
}

export function useAdminAddKeyword() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (keyword: string) => {
      if (!actor) throw new Error("No actor");
      return actor.adminAddBlockedKeyword(keyword, ADMIN_PASSWORD);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "keywords"] });
    },
  });
}

export function useAdminRemoveKeyword() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (keyword: string) => {
      if (!actor) throw new Error("No actor");
      return actor.adminRemoveBlockedKeyword(keyword, ADMIN_PASSWORD);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "keywords"] });
    },
  });
}

import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export type CommentId = bigint;
export interface Comment {
    id: CommentId;
    upvotes: bigint;
    content: string;
    isHidden: boolean;
    timestamp: bigint;
    ipHash: IpHash;
    postId: PostId;
}
export type PostId = bigint;
export interface UpvoteResult {
    alreadyVoted: boolean;
    newCount: bigint;
}
export interface Stats {
    dailyPostCounts: Array<bigint>;
    totalPosts: bigint;
    totalComments: bigint;
}
export type IpHash = string;
export interface PostsPage {
    totalCount: bigint;
    posts: Array<Post>;
}
export interface PostWithComments {
    post: Post;
    comments: Array<Comment>;
}
export interface Post {
    id: PostId;
    upvotes: bigint;
    title: string;
    content: string;
    isHidden: boolean;
    timestamp: bigint;
    ipHash: IpHash;
    commentCount: bigint;
    category?: CategoryId;
}
export type CategoryId = bigint;
export interface Category {
    id: CategoryId;
    name: string;
    isActive: boolean;
}
export enum CreateCommentError {
    bannedIp = "bannedIp",
    internalError = "internalError",
    contentBlocked = "contentBlocked"
}
export enum CreatePostError {
    rateLimitExceeded = "rateLimitExceeded",
    bannedIp = "bannedIp",
    internalError = "internalError",
    contentBlocked = "contentBlocked"
}
export enum PostTab {
    latest = "latest",
    trending = "trending"
}
export interface backendInterface {
    adminAddBlockedKeyword(keyword: string, adminPassword: string): Promise<boolean>;
    adminAddCategory(name: string, adminPassword: string): Promise<boolean>;
    adminBanIp(ipHash: IpHash, adminPassword: string): Promise<boolean>;
    adminDeleteComment(id: CommentId, adminPassword: string): Promise<boolean>;
    adminDeletePost(id: PostId, adminPassword: string): Promise<boolean>;
    adminGetBannedIps(adminPassword: string): Promise<Array<IpHash> | null>;
    adminGetBlockedKeywords(adminPassword: string): Promise<Array<string> | null>;
    adminGetCategories(adminPassword: string): Promise<Array<Category> | null>;
    adminRemoveBlockedKeyword(keyword: string, adminPassword: string): Promise<boolean>;
    adminRemoveCategory(id: CategoryId, adminPassword: string): Promise<boolean>;
    adminUnbanIp(ipHash: IpHash, adminPassword: string): Promise<boolean>;
    createComment(postId: PostId, content: string, ipHash: IpHash): Promise<{
        __kind__: "ok";
        ok: Comment;
    } | {
        __kind__: "err";
        err: CreateCommentError;
    }>;
    createPost(title: string, content: string, category: CategoryId | null, ipHash: IpHash): Promise<{
        __kind__: "ok";
        ok: Post;
    } | {
        __kind__: "err";
        err: CreatePostError;
    }>;
    getAnonymousId(ipHash: IpHash, postId: PostId): Promise<bigint>;
    getCategories(): Promise<Array<Category>>;
    getComments(postId: PostId): Promise<Array<Comment>>;
    getPost(id: PostId): Promise<PostWithComments>;
    getPosts(tab: PostTab, category: CategoryId | null, page: bigint, pageSize: bigint): Promise<PostsPage>;
    getStats(): Promise<Stats>;
    upvoteComment(commentId: CommentId, ipHash: IpHash): Promise<UpvoteResult | null>;
    upvotePost(postId: PostId, ipHash: IpHash): Promise<UpvoteResult | null>;
}

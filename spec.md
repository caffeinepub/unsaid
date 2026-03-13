# Unsaid

## Current State
Anonymous discussion platform with home feed, post detail, create post (page + sheet), and admin dashboard. Backend runs on Motoko.

## Requested Changes (Diff)

### Add
- try/catch around every mutateAsync call in CreatePage, CreatePostSheet, PostDetailPage (comment + upvote), AdminPage (all tabs)
- Error toast fallback for all silent failures
- useEffect in CreatePostSheet to reset form state when sheet closes
- rateLimitExceeded error key in CreatePostSheet errorMessages map
- Per-post upvoting state (Set of in-flight IDs) in HomePage so one upvote doesn't disable all others
- Proper loading skeleton while actor is initialising in PostDetailPage (avoid false "post not found" screen)

### Modify
- PostDetailPage: fetch categories, resolve category name from ID, display real category name in badge (not hard-coded "Category")
- PostDetailPage: useGetAnonymousId fallback should return null not BigInt(0), guard with != null
- CommentsTab in AdminPage: fetch individual comments per post using getComments, delete by comment.id not post.id
- AdminPage: use sessionStorage instead of localStorage for admin auth flag
- AdminPage CategoriesTab handleRemove/handleSeedDefaults: add try/catch and finally block for isSeeding state reset
- AdminPage KeywordsTab handleAdd/handleRemove: add else branch for ok===false, add try/catch
- AdminPage BannedIpsTab handleUnban: add try/catch and else branch
- AdminPage PostsTab handleDelete: add try/catch
- HomePage category filter chips: unique data-ocid per chip
- useQueries useGetPost: do not return null when actor unavailable, rely on enabled flag

### Remove
- Hard-coded "Category" text in PostDetailPage category badge
- stub category object { id, name: "", isActive: true } in PostDetailPage

## Implementation Plan
1. Fix CreatePage and CreatePostSheet: wrap handleSubmit in try/catch, add missing error key, add form reset useEffect in sheet
2. Fix PostDetailPage: add useGetCategories, resolve category name, fix anonId null guard, add try/catch to comment submit and upvotes, fix actor-loading false error screen
3. Fix AdminPage: CommentsTab to fetch real comments and delete by comment.id; add try/catch + error toasts to all admin mutation handlers; sessionStorage for auth
4. Fix HomePage: per-post isPending tracking
5. Fix useQueries: useGetPost should not return null-as-data when actor unavailable

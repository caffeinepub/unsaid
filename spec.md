# Unsaid

## Current State
The app is a fully anonymous discussion platform ("Whisper Board") with:
- Anonymous posting and commenting (no login required)
- Category-based filtering (Career, Workplace, Startup, Manufacturing, Confessions, Advice)
- Trending + Latest feeds
- Upvoting on posts and comments
- IP/device fingerprinting for anonymous IDs (Anonymous #XXXX)
- Rate limiting: max 5 posts per device per hour (tracked via `postTimestamps` map)
- Profanity/content filter via blocked keywords
- IP banning
- Admin dashboard at `/admin` protected by hardcoded password `whisper2024`
- Admin tools: delete posts/comments, ban IPs, manage blocked keywords, manage categories

## Requested Changes (Diff)

### Add
- Nothing new to add

### Modify
- Rename all branding from "Whisper Board" to "Unsaid" across the frontend (page titles, headers, meta tags, admin panel, etc.)
- Remove the `#rateLimitExceeded` error variant from `CreatePostError` type
- Remove the `postTimestamps` map and all rate limiting logic from `createPost` in the backend
- Update frontend to no longer handle `#rateLimitExceeded` error responses

### Remove
- All rate limiting code in backend (`postTimestamps` map, hourly post count check in `createPost`)
- `#rateLimitExceeded` error variant from the `CreatePostError` type
- Any frontend UI or error messaging related to rate limit exceeded

## Implementation Plan
1. Edit `main.mo`: remove `postTimestamps` map declaration, remove `#rateLimitExceeded` from `CreatePostError`, remove the rate limiting block inside `createPost`
2. Update `backend.d.ts` to reflect the removed `#rateLimitExceeded` variant
3. Update all frontend files: replace "Whisper Board" with "Unsaid", update page title in `index.html`, update any references in components/pages
4. Remove any frontend error handling for `#rateLimitExceeded`

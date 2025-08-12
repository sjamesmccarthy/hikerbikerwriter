# API Route Migration Summary

## Issue

Next.js was showing duplicate page warnings:

```
⚠ Duplicate page detected. pages/api/fieldnotes/[slug].js and src/app/api/fieldnotes/[slug]/route.js resolve to /api/fieldnotes/[slug]
```

## Resolution

Migrated from Pages Router API routes to App Router API routes for fieldnotes.

### Files Removed

- `pages/api/fieldnotes/index.js` (backed up to `backup/pages-api/fieldnotes/`)
- `pages/api/fieldnotes/[slug].js` (backed up to `backup/pages-api/fieldnotes/`)

### Files Added/Modified

- `src/app/api/fieldnotes/route.js` (created - handles GET, POST, PUT, DELETE for fieldnotes collection)
- `src/app/api/fieldnotes/[slug]/route.js` (existing - handles GET for individual fieldnotes)

### API Endpoints

The following fieldnotes API endpoints are now handled by App Router:

- `GET /api/fieldnotes` - List all fieldnotes for a user
- `POST /api/fieldnotes` - Create a new fieldnote
- `PUT /api/fieldnotes` - Update an existing fieldnote
- `DELETE /api/fieldnotes` - Delete a fieldnote
- `GET /api/fieldnotes/[slug]` - Get a specific fieldnote by slug

### Remaining Pages Router APIs

The following APIs remain in Pages Router format:

- `pages/api/auth/[...nextauth].ts` - NextAuth authentication
- `pages/api/jmgalleries.js` - JM Galleries API
- `pages/api/recipes/` - Recipe management APIs
- `pages/api/users/` - User management API

### Migration Notes

- The App Router versions use `NextResponse` instead of the traditional `req, res` pattern
- Query parameters are accessed via `new URL(request.url).searchParams`
- Request body is accessed via `await request.json()`
- Database operations remain the same using the shared `pool` from `@/lib/db`

### Result

✅ No more duplicate page warnings
✅ Modern App Router API structure for fieldnotes
✅ Backward compatibility maintained through consistent API contracts

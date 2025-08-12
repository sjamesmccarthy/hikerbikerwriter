# User Management System

This application now uses a database-based user management system instead of environment variables for controlling access.

## Database Schema

The `users` table has the following structure:

- `id` - Auto-increment primary key
- `email` - User's email address (unique)
- `name` - User's display name
- `oauth` - OAuth provider (default: 'GOOGLE')
- `created` - Timestamp when user was created

## Managing Users

### Command Line Tool

Use the `manage-users.js` script to manage users from the command line:

```bash
# List all authorized users
NODE_ENV=development node manage-users.js list

# Add a new user
NODE_ENV=development node manage-users.js add "user@example.com" "John Doe"

# Remove a user
NODE_ENV=development node manage-users.js remove "user@example.com"
```

### Web API

The application also provides a REST API at `/api/users` for managing users programmatically:

- `GET /api/users` - List all users (requires authentication)
- `POST /api/users` - Add a new user (requires authentication)
- `DELETE /api/users` - Remove a user (requires authentication)

## Migration from Environment Variables

The migration has been completed:

1. ✅ Created `users` table in database
2. ✅ Migrated your email (hikerbikerwriter@gmail.com) to the database
3. ✅ Updated NextAuth configuration to check database instead of `ALLOWED_EMAILS`
4. ✅ Commented out `ALLOWED_EMAILS` in `.env.local`

## Authentication Flow

1. User attempts to sign in with Google OAuth
2. NextAuth calls the `signIn` callback
3. The callback queries the `users` table to check if the email exists
4. If the user exists, authentication succeeds
5. If not, user is redirected to access denied page

## Files Modified

- `database-schema.sql` - Added users table schema
- `pages/api/auth/[...nextauth].ts` - Updated to use database authentication
- `.env.local` - Commented out ALLOWED_EMAILS variable
- `migrate-users.js` - Migration script (can be deleted after use)
- `manage-users.js` - User management CLI tool
- `pages/api/users/index.js` - User management API endpoint

## Security Notes

- Only authenticated users can access the user management API
- Users cannot delete their own accounts via the API
- All database queries use parameterized statements to prevent SQL injection
- Duplicate email addresses are prevented by unique constraint

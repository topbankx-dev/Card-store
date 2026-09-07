# Vercel Environment Variables Setup

## Required Environment Variables for Vercel Deployment

Your app needs the following environment variables set in your Vercel project settings (https://vercel.com/[your-team]/[your-project]/settings/environment-variables).

### Critical: Keep Secrets Secret

**NEVER commit your `.env` file to GitHub.** The repo's `.gitignore` should exclude it. The values below are only set in Vercel's dashboard, never in the code.

### Required Variables

| Variable Name | Scope | Where to Find |
|--------------|-------|---------------|
| `NEXT_PUBLIC_SUPABASE_URL` | All (Production, Preview, Development) | Supabase Dashboard → Settings → API → Project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | All | Supabase Dashboard → Settings → API → Project API keys → `anon` `public` |
| `SUPABASE_SERVICE_ROLE_KEY` | Production (and optionally Preview) | Supabase Dashboard → Settings → API → Project API keys → `service_role` (SECRET!) |

### Optional (for specific features)

| Variable Name | Purpose |
|--------------|---------|
| `AUTH_SECRET` | NextAuth session encryption |
| `NEXTAUTH_URL` | NextAuth callback URL (your Vercel domain) |
| `STRIPE_SECRET_KEY` | If using Stripe payments |
| `STRIPE_WEBHOOK_SECRET` | If using Stripe webhooks |
| `RESEND_API_KEY` | If using Resend for email |

## Setup Steps

1. **Go to Vercel Dashboard**
   - Navigate to your project: https://vercel.com/dashboard
   - Select the "card-store" project (or whatever you named it)

2. **Add Environment Variables**
   - Click **Settings** → **Environment Variables**
   - For each variable above:
     - **Name**: The variable name (e.g., `SUPABASE_SERVICE_ROLE_KEY`)
     - **Value**: Paste the actual value from Supabase
     - **Environments**: Select Production, Preview, and Development
   - Click **Save**

3. **Redeploy**
   - After adding variables, go to **Deployments** tab
   - Click the three dots on the latest deployment → **Redeploy**
   - This ensures the new env vars are picked up

4. **Verify in Browser Console**
   - Visit your deployed site
   - Open DevTools → Network tab
   - Try creating an event in `/admin/events/new`
   - Check the request payload and Supabase response

## GitHub Secret Protection

Your GitHub repository should be set to block commits that contain secrets. If you haven't already:

1. Go to https://github.com/settings/security-analysis
2. Enable "Secret scanning" and "Push protection"

The Vercel integration with GitHub will also automatically check for leaked secrets.

## Local Development

For local development, your `.env` file should look like:

```
NEXT_PUBLIC_SUPABASE_URL=https://xxxxxxxxxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...your_anon_key
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...your_service_role_key
```

**Important**:
- The `.env` file is in `.gitignore` and should NEVER be committed
- Vercel reads from the dashboard, not from the repo

## Database Migration Reminder

After fixing the API code, you MUST run the new migration in Supabase:

1. Go to Supabase Dashboard → SQL Editor
2. Copy the contents of `supabase/migrations/20260907000005_trust_policy_columns.sql`
3. Run the SQL
4. Verify no errors

Without this migration, saving events with trust policy data will fail.

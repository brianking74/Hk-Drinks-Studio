# Deploying HKDrinks Studio to Production

This guide walks you through deploying the app to a public URL so you can access it from anywhere. Total time: ~30-45 minutes.

## Architecture Overview

| Component | Service | Cost | Why |
|-----------|---------|------|-----|
| **Hosting** | Vercel | Free | Made by Next.js team, zero-config deploy, automatic HTTPS, custom domains |
| **Database** | Supabase | Free | Hosted PostgreSQL with generous free tier, Prisma-compatible |
| **Domain** | `studio.hkdrinks.shop` (or your subdomain of choice) | Free (you already own the domain) | Branded URL |

---

## Phase 1: Push Code to GitHub (5 minutes)

The code currently lives in your sandbox. To deploy it, you need to push it to a GitHub repo.

### Step 1.1: Create a new GitHub repo

1. Go to https://github.com/new
2. **Repository name**: `hkdrinks-studio`
3. **Visibility**: Private (recommended — your `.env` is gitignored, but private is safer)
4. **Don't** initialize with README/license (we'll push existing code)
5. Click **Create repository**

### Step 1.2: Push the code

From the sandbox terminal, run these commands (replace `<your-username>` with your GitHub username):

```bash
cd /home/z/my-project

# Initialize git (if not already)
git init
git add .
git commit -m "Initial commit — HKDrinks Studio"

# Set the remote and push
git branch -M main
git remote add origin https://github.com/<your-username>/hkdrinks-studio.git
git push -u origin main
```

You'll be prompted for your GitHub username + Personal Access Token (PAT). Create a PAT at https://github.com/settings/tokens (classic) with `repo` scope.

---

## Phase 2: Set Up Supabase Database (5 minutes)

### Step 2.1: Create a Supabase account

1. Go to https://supabase.com/
2. Click **Start your project** → sign in with GitHub
3. Create a new organization (free)

### Step 2.2: Create a new project

1. Click **New Project**
2. **Name**: `hkdrinks-studio`
3. **Database Password**: generate a strong password, save it somewhere safe
4. **Region**: `Southeast Asia (Singapore)` — closest to Hong Kong
5. **Plan**: Free
6. Click **Create new project**

Wait ~2 minutes for the project to provision.

### Step 2.3: Get the database URL

1. In your Supabase project, click the **Connect** button (top right)
2. Or go to **Project Settings → Database → Connection string**
3. Choose **URI** format
4. Copy the connection string — it looks like:
   ```
   postgresql://postgres.[your-project-ref]:[YOUR-PASSWORD]@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres
   ```
5. Replace `[YOUR-PASSWORD]` with the password you set in Step 2.2

Save this string — you'll paste it into Vercel as `DATABASE_URL`.

### Step 2.4: Push the schema to Supabase

From your local sandbox:

```bash
# Set the DATABASE_URL temporarily (replace with your Supabase URL)
export DATABASE_URL="postgresql://postgres.xxxxx:password@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres"

# Push the schema
cd /home/z/my-project
bun run db:push
```

You should see "🚀 Your database is now in sync with your Prisma schema."

---

## Phase 3: Deploy to Vercel (10 minutes)

### Step 3.1: Create a Vercel account

1. Go to https://vercel.com/
2. Click **Sign Up** → **Continue with GitHub**
3. Authorize Vercel to access your GitHub

### Step 3.2: Import the project

1. Click **Add New… → Project**
2. Find `hkdrinks-studio` in your repo list → click **Import**
3. Vercel auto-detects Next.js — leave Framework Preset as "Next.js"
4. **Root Directory**: `./` (default)
5. **Build Command**: leave as default (`prisma generate && next build` from vercel.json)
6. **Install Command**: leave as default (`bun install`)

### Step 3.3: Add environment variables

Scroll down to **Environment Variables** and add each of these (one at a time):

| Key | Value | Where you got it |
|-----|-------|------------------|
| `DATABASE_URL` | `postgresql://postgres.xxxxx:password@aws-0-...supabase.com:6543/postgres` | Phase 2.3 above |
| `META_APP_ID` | `1399563551640566` | From your `.env` |
| `META_APP_SECRET` | (your 32-char secret) | From your `.env` |
| `META_PAGE_ID` | `820518311147657` | From your `.env` |
| `META_IG_USER_ID` | `17841478187991967` | From your `.env` |
| `META_PAGE_ACCESS_TOKEN` | (your long token starting with `EAAT...`) | From your `.env` |
| `NEXT_PUBLIC_APP_URL` | `https://hkdrinks-studio.vercel.app` (or your custom domain) | Will update after first deploy |

**Tip**: For `NEXT_PUBLIC_APP_URL`, leave it as `https://hkdrinks-studio.vercel.app` for now (replace `hkdrinks-studio` with your actual Vercel project name). You can update it later if you add a custom domain.

### Step 3.4: Deploy

1. Click **Deploy**
2. Wait ~3-5 minutes for the build to complete
3. Vercel will give you a URL like `https://hkdrinks-studio-xyz.vercel.app`

### Step 3.5: Test the deployed app

1. Open the Vercel URL in your browser
2. The Meta status panel should show FB: ✅ Live
3. Upload a test image → generate caption → publish to Facebook → confirm it works

---

## Phase 4: Add Custom Domain (Optional, 10 minutes)

To use `studio.hkdrinks.shop` instead of the Vercel subdomain:

### Step 4.1: Add the domain in Vercel

1. In your Vercel project → **Settings → Domains**
2. Enter `studio.hkdrinks.shop` → click **Add**
3. Vercel shows you a CNAME record to add:
   ```
   Type:  CNAME
   Name:  studio
   Value: cname.vercel-dns.com
   ```

### Step 4.2: Add the CNAME to your DNS

1. Log into your DNS provider (wherever `hkdrinks.shop` is managed — Cloudflare, GoDaddy, Namecheap, etc.)
2. Add the CNAME record from Step 4.1
3. Wait 5-30 minutes for DNS to propagate

### Step 4.3: Update env var

1. Back in Vercel → **Settings → Environment Variables**
2. Update `NEXT_PUBLIC_APP_URL` to `https://studio.hkdrinks.shop`
3. **Redeploy** (Deployments → click the ⋮ next to the latest → Redeploy)

### Step 4.4: Verify HTTPS

Vercel automatically provisions SSL certificates. Once DNS propagates, visit `https://studio.hkdrinks.shop` — you should see your app with a green lock icon.

---

## Phase 5: Update Meta App Settings (5 minutes)

So Meta knows your new URL is a legit redirect target:

### Step 5.1: Add the URL to Meta App Settings

1. Go to https://developers.facebook.com/apps/1399563551640566/
2. Left sidebar → **App settings → Basic**
3. **App Domains**: add `hkdrinks-studio.vercel.app` (and `studio.hkdrinks.shop` if you set up a custom domain)
4. **Site URL**: `https://hkdrinks-studio.vercel.app` (or your custom domain)
5. **Save changes**

### Step 5.2: Add to Facebook Login redirect URIs

1. Left sidebar → **Facebook Login → Settings**
2. **Valid OAuth Redirect URIs**: add:
   ```
   https://hkdrinks-studio.vercel.app/api/auth/callback/facebook
   https://studio.hkdrinks.shop/api/auth/callback/facebook
   ```
3. **Save**

That's it — your Meta app now knows about the new deployment.

---

## How to Update the App Later

When you make code changes and push to GitHub:

```bash
git add .
git commit -m "Your change description"
git push
```

Vercel will automatically rebuild and deploy within ~2 minutes. You'll see the new deployment in your Vercel dashboard.

## How to Rotate the Page Access Token

The Meta Page Access Token doesn't expire on its own, but if it ever gets compromised (or you want to rotate it for security):

1. Go to https://developers.facebook.com/tools/explorer/
2. Select your app `Z.Ai Auto Poster`
3. Generate a new token with all 4 permissions
4. Send me the new short token — I'll exchange it for a long-lived Page token
5. Update `META_PAGE_ACCESS_TOKEN` in Vercel → Settings → Environment Variables
6. Redeploy

## Troubleshooting

### "Database connection failed" on Vercel

- Double-check the `DATABASE_URL` is the **connection pooler** URL (port 6543), not the direct connection (port 5432). Supabase shows both — use the pooler one for serverless.
- Make sure you replaced `[YOUR-PASSWORD]` with your actual database password.

### Build fails on Vercel

- Check the build logs in Vercel → Deployments → click the failing deploy → Build Logs
- Common cause: missing env vars. Make sure all 7 are set.
- If `prisma generate` fails, make sure `DATABASE_URL` is set in **both** Production and Preview environments in Vercel.

### App loads but Meta status shows "Issue"

- Verify all 5 `META_*` env vars are correct
- Check `/api/meta/verify` endpoint directly — visit `https://your-app.vercel.app/api/meta/verify` in your browser
- If the token shows as invalid, regenerate it (see "How to Rotate" above)

### Image upload fails

- The app uses data URLs for image upload (works on Vercel serverless)
- Max size is 12MB — for larger images, use a public URL instead (e.g. from hkdrinks.shop)
- Scheduled posts require a public image URL — data URLs can't be stored in the DB

### IG publishing fails

- IG is currently unavailable due to a Meta-side issue with your IG Business account
- See the conversation history for full diagnosis
- When you set up a fresh IG Business account, the code is ready — just update `META_IG_USER_ID` and `META_PAGE_ACCESS_TOKEN`

## Cost Summary

| Service | Free Tier Limits | Your Expected Usage |
|---------|------------------|---------------------|
| Vercel | 100GB bandwidth, 1000 builds/month | Well under |
| Supabase | 500MB database, 50k monthly active users | Well under |
| Meta Graph API | Free | Free |
| Custom domain | You already own hkdrinks.shop | $0 |

**Total monthly cost: $0** for typical use (a few posts per day).

You'd only start paying if:
- Vercel: you exceed 100GB bandwidth (~50,000 page views)
- Supabase: you exceed 500MB database (would need ~100,000 posts stored)

## Need Help?

If something breaks during deployment:
1. Take a screenshot of the error
2. Note which step you were on
3. Send it to your assistant — they can diagnose and fix

The app is designed to be portable — your local sandbox, Vercel preview, and production all use the same code, just different env vars. So any issue can be reproduced and debugged locally.

---

**Happy posting!** 🥃

Once deployed, your app is at `https://studio.hkdrinks.shop` (or whatever URL you set up) — accessible from your phone, laptop, anywhere. Bookmark it and post on the go.

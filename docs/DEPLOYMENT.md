# Production Deployment Guide - Cloudflare Pages

Complete guide for deploying 10xCards to Cloudflare Pages.

## 📋 Prerequisites

Before deploying, ensure you have:

- [ ] GitHub repository with your code
- [ ] Cloudflare account ([sign up free](https://dash.cloudflare.com/sign-up))
- [ ] Production Supabase project configured ([guide](./PRODUCTION_SUPABASE.md))
- [ ] OpenRouter API key ([get one](https://openrouter.ai/keys))
- [ ] All tests passing locally (`npm run test` and `npm run build`)

## 🚀 Deployment Steps

### Step 1: Push Code to GitHub

```bash
# Ensure all changes are committed
git status

# Push to main branch
git push origin main
```

### Step 2: Create Cloudflare Pages Project

1. Go to [Cloudflare Dashboard](https://dash.cloudflare.com)
2. Click **Pages** in the left sidebar
3. Click **Create a project**
4. Click **Connect to Git**
5. Authorize GitHub access
6. Select your repository: `10xdev` or your repo name
7. Click **Begin setup**

### Step 3: Configure Build Settings

**Framework preset**: `Astro`

Cloudflare will auto-detect, but verify:

| Setting | Value |
|---------|-------|
| **Production branch** | `main` |
| **Build command** | `npm run build` |
| **Build output directory** | `dist` |
| **Root directory** | `src` (if your code is in src folder) |
| **Node version** | `20` or latest |

Click **Save and Deploy** (will fail first time - we need environment variables)

### Step 4: Add Environment Variables

1. In Cloudflare Pages project, go to **Settings** → **Environment variables**
2. Click **Add variables**
3. Add the following for **Production**:

| Variable Name | Value | Notes |
|--------------|-------|-------|
| `PUBLIC_SUPABASE_URL` | `https://your-prod-project.supabase.co` | From production Supabase |
| `PUBLIC_SUPABASE_ANON_KEY` | `eyJhbGci...` | Production anon key |
| `SUPABASE_SERVICE_ROLE_KEY` | `eyJhbGci...` | Production service role key |
| `OPENROUTER_API_KEY` | `sk-or-v1-...` | Your OpenRouter API key |
| `NODE_VERSION` | `20` | Ensures correct Node version |

**Important**:
- Keep `SUPABASE_SERVICE_ROLE_KEY` secret (encrypted by default)
- `PUBLIC_*` variables are exposed to frontend
- Click **Encrypt** for sensitive keys

4. Optionally add same variables for **Preview** (for preview deployments)

### Step 5: Trigger Deployment

Two options:

**Option A: Retry Current Deployment**
1. Go to **Deployments** tab
2. Click on failed deployment
3. Click **Retry deployment**

**Option B: Trigger New Deployment**
1. Push any commit to GitHub
2. Cloudflare automatically deploys

Wait 2-3 minutes for build to complete.

### Step 6: Verify Deployment

Once deployment succeeds:

1. Click **Visit site** to open your deployed app
2. Test critical flows:
   - ✅ Homepage loads
   - ✅ Register new account
   - ✅ Login with account
   - ✅ Generate flashcards
   - ✅ View My Flashcards
   - ✅ Edit/delete flashcards

3. Check browser console for errors (F12 → Console)
4. Verify data appears in production Supabase Dashboard

### Step 7: Configure Custom Domain (Optional)

1. Go to **Custom domains** tab
2. Click **Set up a custom domain**
3. Enter your domain: `10xcards.com` or `app.yourdomain.com`
4. Follow DNS configuration instructions:
   - Add CNAME record pointing to `your-project.pages.dev`
5. Wait for DNS propagation (5-30 minutes)
6. SSL certificate is automatically provisioned

**No custom domain?** Use the Cloudflare Pages URL: `https://10xcards.pages.dev`

## 🔄 Continuous Deployment

Cloudflare Pages automatically deploys on every push to main:

```bash
# Make changes locally
git add .
git commit -m "feat: add new feature"
git push origin main

# Cloudflare automatically:
# 1. Detects push
# 2. Runs build
# 3. Deploys to production
# 4. Updates live site
```

### Preview Deployments

Every branch and PR gets a preview deployment:

1. Create a new branch:
   ```bash
   git checkout -b feature/new-feature
   ```

2. Push to GitHub:
   ```bash
   git push origin feature/new-feature
   ```

3. Cloudflare creates a preview URL:
   - `https://feature-new-feature.your-project.pages.dev`

4. Test changes before merging to main

## 📊 Monitoring & Analytics

### Built-in Analytics

1. Go to **Analytics** tab in Cloudflare Pages
2. View:
   - Page views
   - Unique visitors
   - Bandwidth usage
   - Cache hit rate

### Real-time Logs

1. Go to **Deployments** → Select deployment
2. View **Build log** for build-time errors
3. View **Functions log** for runtime errors (Astro API routes)

### Web Analytics (Optional)

1. Enable **Cloudflare Web Analytics**:
   - Go to **Web Analytics** in Cloudflare dashboard
   - Add your domain
   - Add tracking script to `src/layouts/Layout.astro`

## 🛠️ Troubleshooting

### Build Fails

**Error**: `Command failed with exit code 1`

**Solution**:
1. Check build log in Cloudflare
2. Ensure `npm run build` works locally
3. Verify Node version matches (`NODE_VERSION=20`)
4. Check for missing dependencies

### Environment Variables Not Working

**Error**: `PUBLIC_SUPABASE_URL is undefined`

**Solution**:
1. Verify variables are set in Cloudflare Pages settings
2. Redeploy after adding variables
3. Check variable names match exactly (case-sensitive)
4. For `PUBLIC_*` variables, ensure they start with `PUBLIC_`

### 404 Errors on Routes

**Error**: Page refreshes return 404

**Solution**:
- Astro SSR should handle this automatically with Cloudflare adapter
- Verify `output: 'server'` in `astro.config.mjs`
- Check Functions logs for errors

### API Routes Not Working

**Error**: API routes return 500 or timeout

**Solution**:
1. Check **Functions log** in deployment details
2. Verify environment variables are accessible
3. Check Supabase connection from Cloudflare
4. Verify OpenRouter API key is valid

### Slow Performance

**Solution**:
1. Enable caching in Cloudflare
2. Go to **Caching** → **Configuration**
3. Set cache rules for static assets
4. Use Cloudflare CDN for images

## 🔐 Security Best Practices

### Environment Variables

- ✅ Never commit `.env`, `.env.production` to git
- ✅ Use Cloudflare's encrypted variables for sensitive keys
- ✅ Rotate keys periodically
- ✅ Use different credentials for dev/staging/production

### Rate Limiting

Add rate limiting to protect API routes:

1. Go to **Security** → **WAF** in Cloudflare
2. Create rate limiting rules:
   - `/api/generations` - 10 requests/minute per IP
   - `/api/flashcards` - 100 requests/minute per IP
   - `/api/login` - 5 requests/minute per IP

### DDoS Protection

Cloudflare provides automatic DDoS protection. Enable:

1. **Under Attack Mode** (if under attack)
2. **Bot Fight Mode** (free tier)
3. **Security Level**: Medium or High

## 📈 Performance Optimization

### Caching Strategy

```javascript
// In API routes, add cache headers
export async function GET({ request }) {
  return new Response(data, {
    headers: {
      'Cache-Control': 'public, max-age=60, s-maxage=60'
    }
  });
}
```

### Image Optimization

Use Cloudflare Images:

1. Go to **Images** in Cloudflare dashboard
2. Upload images
3. Use optimized URLs with automatic resizing

### CDN Configuration

Static assets are automatically cached at edge locations worldwide.

## 🔄 Rollback Procedure

If deployment breaks production:

1. Go to **Deployments** tab
2. Find last working deployment
3. Click **⋮** (three dots)
4. Click **Rollback to this deployment**
5. Confirm rollback

Your site is instantly reverted to previous version.

## 📋 Pre-deployment Checklist

Before each deployment:

- [ ] All tests pass locally (`npm run test`)
- [ ] Build succeeds locally (`npm run build`)
- [ ] Code reviewed and approved
- [ ] Environment variables updated (if needed)
- [ ] Database migrations applied to production
- [ ] Changelog updated
- [ ] Backup of production database taken

## 🎯 Post-deployment Checklist

After each deployment:

- [ ] Verify site loads correctly
- [ ] Test authentication flows
- [ ] Test flashcard generation
- [ ] Check error logs in Cloudflare
- [ ] Monitor Supabase for errors
- [ ] Test on mobile devices
- [ ] Verify analytics tracking

## 📚 Additional Resources

- [Cloudflare Pages Docs](https://developers.cloudflare.com/pages/)
- [Astro Cloudflare Adapter](https://docs.astro.build/en/guides/integrations-guide/cloudflare/)
- [Supabase Production Checklist](https://supabase.com/docs/guides/platform/going-into-prod)

## 🆘 Support

If you encounter issues:

1. Check [Cloudflare Status](https://www.cloudflarestatus.com/)
2. Review deployment logs in Cloudflare dashboard
3. Check [Cloudflare Community](https://community.cloudflare.com/)
4. Contact Cloudflare support (paid plans)

---

**Congratulations!** Your 10xCards app is now live on Cloudflare Pages! 🎉

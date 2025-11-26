# 🚀 Production Deployment Checklist

Quick reference checklist for deploying 10xCards to production.

## Pre-deployment

### Code Quality

- [ ] All unit tests pass (`npm run test`)
- [ ] All E2E tests pass (`npm run test:e2e`)
- [ ] Build completes successfully (`npm run build`)
- [ ] No TypeScript errors (`npx astro check`)
- [ ] Code linted and formatted (`npm run lint && npm run format:check`)
- [ ] All commits pushed to GitHub (`git status`)

### Production Supabase Setup

- [ ] Production Supabase project created
- [ ] Database migrations applied (see [PRODUCTION_SUPABASE.md](./PRODUCTION_SUPABASE.md))
- [ ] RLS policies enabled on all tables
- [ ] Email authentication configured
- [ ] SMTP settings configured (or accept Supabase rate limits)
- [ ] Site URL and redirect URLs configured
- [ ] Test user created for smoke testing

### Environment Variables Prepared

- [ ] `PUBLIC_SUPABASE_URL` (production)
- [ ] `PUBLIC_SUPABASE_ANON_KEY` (production)
- [ ] `SUPABASE_SERVICE_ROLE_KEY` (production)
- [ ] `OPENROUTER_API_KEY`
- [ ] All credentials saved securely (password manager)

### Documentation

- [ ] README.md updated with production URL
- [ ] Deployment documentation reviewed
- [ ] Team notified of deployment

## Cloudflare Pages Setup

### Account & Project

- [ ] Cloudflare account created (free tier OK)
- [ ] GitHub repository connected to Cloudflare Pages
- [ ] Project created with correct settings:
  - Build command: `npm run build`
  - Build output: `dist`
  - Root directory: `src` (if applicable)
  - Node version: `20`

### Environment Variables

- [ ] All production environment variables added
- [ ] Sensitive keys marked as encrypted
- [ ] Preview environment variables configured (optional)

### Initial Deployment

- [ ] First deployment triggered
- [ ] Build logs reviewed for errors
- [ ] Deployment successful (green checkmark)

## Post-deployment Verification

### Functional Testing

- [ ] Homepage loads correctly
- [ ] Register new test account
- [ ] Verify email confirmation (check inbox/spam)
- [ ] Login with test account
- [ ] Generate flashcards from sample text
- [ ] View generated flashcards
- [ ] Edit a flashcard
- [ ] Delete a flashcard
- [ ] Logout functionality works
- [ ] Login again to verify persistence

### Technical Checks

- [ ] No console errors in browser (F12 → Console)
- [ ] All assets loading (images, CSS, JS)
- [ ] API routes responding correctly
- [ ] Database records created in Supabase
- [ ] SSL certificate active (https://)
- [ ] Mobile responsive design verified

### Performance & SEO

- [ ] Page load time < 3 seconds
- [ ] Lighthouse score reviewed (aim for 90+)
- [ ] Meta tags present (Open Graph, Twitter Card)
- [ ] Favicon displays correctly

### Monitoring Setup

- [ ] Cloudflare Analytics enabled
- [ ] Error tracking configured (optional: Sentry)
- [ ] Supabase monitoring dashboard reviewed
- [ ] Browser console checked for warnings

## Security Verification

### Authentication

- [ ] Password requirements enforced
- [ ] Email verification working
- [ ] Session management working correctly
- [ ] Logout clears session properly
- [ ] Protected routes require authentication

### Database Security

- [ ] RLS policies tested (can't access other users' data)
- [ ] Service role key not exposed to frontend
- [ ] SQL injection protection verified

### General Security

- [ ] HTTPS enabled (automatic with Cloudflare)
- [ ] Environment variables not exposed in client
- [ ] No sensitive data in error messages
- [ ] Rate limiting configured (optional but recommended)

## Production Configuration

### Domain (If Applicable)

- [ ] Custom domain added to Cloudflare Pages
- [ ] DNS records configured
- [ ] SSL certificate issued
- [ ] Domain resolves correctly
- [ ] Redirect from www to apex (or vice versa)

### Caching & CDN

- [ ] Cloudflare CDN enabled (automatic)
- [ ] Cache rules configured for static assets
- [ ] API routes not cached inappropriately

### Error Handling

- [ ] 404 page displays correctly
- [ ] 500 error page configured
- [ ] API errors return meaningful messages
- [ ] Error logging to console/monitoring service

## Continuous Deployment

### GitHub Integration

- [ ] Automatic deployments on push to main
- [ ] Preview deployments for branches/PRs
- [ ] Build notifications configured (email/Slack)

### Rollback Plan

- [ ] Know how to rollback deployment (Cloudflare UI)
- [ ] Previous deployment accessible
- [ ] Database backup available

## Go-Live

### Final Checks

- [ ] All checklist items above completed ✅
- [ ] Team ready for launch
- [ ] Support channels prepared
- [ ] Monitoring dashboards open

### Launch

- [ ] Announce launch (if applicable)
- [ ] Monitor for first 30 minutes
- [ ] Check error logs
- [ ] Test key user flows
- [ ] Respond to any issues immediately

### Post-Launch (First 24 Hours)

- [ ] Monitor analytics for traffic
- [ ] Check error rates in Cloudflare
- [ ] Review Supabase usage
- [ ] Collect user feedback
- [ ] Address any critical bugs
- [ ] Celebrate successful deployment! 🎉

## Ongoing Maintenance

### Daily

- [ ] Check error logs
- [ ] Monitor uptime (Cloudflare status)
- [ ] Review user reports

### Weekly

- [ ] Review analytics
- [ ] Check database size/usage
- [ ] Update dependencies (if needed)
- [ ] Review and merge PRs

### Monthly

- [ ] Backup production database
- [ ] Review Supabase usage and costs
- [ ] Review Cloudflare analytics
- [ ] Rotate API keys (security best practice)
- [ ] Update documentation

## Emergency Procedures

### If Site Goes Down

1. Check [Cloudflare Status](https://www.cloudflarestatus.com/)
2. Check [Supabase Status](https://status.supabase.com/)
3. Review recent deployments in Cloudflare
4. Rollback to last working deployment if needed
5. Check error logs in Cloudflare Functions
6. Notify users (if extended outage)

### If Database Issues

1. Check Supabase dashboard for errors
2. Review connection pool usage
3. Check RLS policies
4. Verify migrations applied correctly
5. Restore from backup if needed

### If API Rate Limits Hit

1. Review OpenRouter usage
2. Implement request throttling
3. Add user-facing rate limit messages
4. Consider upgrading API plan

## Resources

- [Full Deployment Guide](./DEPLOYMENT.md)
- [Production Supabase Guide](./PRODUCTION_SUPABASE.md)
- [Cloudflare Pages Docs](https://developers.cloudflare.com/pages/)
- [Supabase Production Best Practices](https://supabase.com/docs/guides/platform/going-into-prod)

---

**Last Updated**: 2025-11-25
**Status**: Ready for production ✅

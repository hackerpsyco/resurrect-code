# Custom Domain Setup for Innoalaxy

## Overview
This guide explains how to set up `auth.innoalaxy.in` as a custom domain for your Supabase project.

## Current Status
✅ Code updated to use `auth.innoalaxy.in`
⏳ Waiting for DNS configuration

## Step 1: Add DNS Record

Go to your domain registrar (where you registered `innoalaxy.in`) and add this DNS record:

**Type:** CNAME  
**Name:** auth  
**Value:** eahpikunzsaacibikwtj.supabase.co  

This creates: `auth.innoalaxy.in` → `eahpikunzsaacibikwtj.supabase.co`

## Step 2: Configure in Supabase Dashboard

1. Go to [Supabase Dashboard](https://app.supabase.com)
2. Select your project
3. Go to **Settings** → **Custom Domains**
4. Click **Add Custom Domain**
5. Enter: `auth.innoalaxy.in`
6. Supabase will provide additional DNS records to verify ownership
7. Add those records to your domain registrar
8. Click **Verify** in Supabase

## Step 3: Wait for DNS Propagation

DNS changes can take 5-30 minutes to propagate globally. You can check status with:

```bash
nslookup auth.innoalaxy.in
```

## Step 4: Update Google OAuth

Once the custom domain is active:

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Find your OAuth 2.0 credentials
3. Update **Authorized redirect URIs** to:
   - `https://auth.innoalaxy.in/auth/v1/callback`
   - Keep the old Supabase URL for now as backup

## What Changed in Code

✅ `.env` - Updated VITE_SUPABASE_URL  
✅ `vite.config.ts` - Updated proxy target  
✅ `kestra/workflows/resurrect-agent.yml` - Updated supabase_url  

## Testing

After DNS propagates:

1. Visit your app
2. Try Google OAuth login
3. You should see "to continue to innoalaxy.in" instead of the Supabase URL

## Troubleshooting

**DNS not resolving?**
- Wait 15-30 minutes for propagation
- Check DNS records are correct
- Use `nslookup` or `dig` to verify

**Supabase verification failing?**
- Ensure CNAME record is added first
- Wait for DNS propagation
- Check Supabase dashboard for specific error

**OAuth still showing old URL?**
- Clear browser cache
- Hard refresh (Ctrl+Shift+R)
- Check Google Cloud Console settings

## Rollback (if needed)

If you need to revert to the Supabase URL:

```env
VITE_SUPABASE_URL=https://eahpikunzsaacibikwtj.supabase.co
```

Then restart your app.

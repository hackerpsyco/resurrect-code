# Supabase OTP Email Configuration Guide

This guide explains all the Supabase Dashboard settings you need to configure for OTP (One-Time Password) email signup to work properly.

## 📋 Required Supabase Dashboard Configuration

### 1. **Authentication → Providers → Email**

Go to: `Supabase Dashboard → Authentication → Providers → Email`

**Settings to configure:**

- ✅ **Enable Email provider**: TURN ON
- ✅ **Enable email signup**: TURN ON
- ⚠️ **Confirm email**: Set to **OFF** (or ON if you want email confirmation + OTP)
- ✅ **Secure email change**: TURN ON (recommended)
- ✅ **Enable Custom SMTP**: OPTIONAL (see Custom SMTP section below)

**Important Notes:**
- If "Confirm email" is ON, users will receive BOTH a confirmation email link AND an OTP. You may want to keep it OFF for OTP-only flow.
- The default rate limit is **4 emails per hour per user** (can't be changed on free tier).

---

### 2. **Authentication → URL Configuration**

Go to: `Supabase Dashboard → Authentication → URL Configuration`

**Site URL:**
```
http://localhost:5173
```
(Or your production URL: `https://yourdomain.com`)

**Redirect URLs - Add these:**
```
http://localhost:5173/**
http://localhost:5173/dashboard
http://localhost:5173/auth/callback
https://yourdomain.com/**
https://yourdomain.com/dashboard
https://yourdomain.com/auth/callback
```

**Important:** The redirect URLs allow Supabase to redirect users back to your app after authentication.

---

### 3. **Authentication → Email Templates**

Go to: `Supabase Dashboard → Authentication → Email Templates`

You need to configure the **OTP (Magic Link) Template**:

#### **Template: Magic Link / OTP**

**Subject:**
```
Your OTP Code for ResurrectCI
```

**Email Body (HTML):**
```html
<h2>Your OTP Verification Code</h2>
<p>Thank you for signing up for ResurrectCI!</p>
<p>Your verification code is:</p>
<h1 style="font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #3b82f6; text-align: center; padding: 20px; background: #f3f4f6; border-radius: 8px; margin: 20px 0;">
{{ .Token }}
</h1>
<p>Enter this 6-digit code in the app to verify your email address.</p>
<p><strong>This code will expire in 1 hour.</strong></p>
<p>If you didn't request this code, you can safely ignore this email.</p>
<hr>
<p style="color: #6b7280; font-size: 12px;">
  This is an automated message from ResurrectCI.
</p>
```

**Variables available:**
- `{{ .Token }}` - The 6-digit OTP code
- `{{ .Email }}` - User's email address
- `{{ .SiteURL }}` - Your site URL
- `{{ .RedirectTo }}` - Redirect URL after verification

**Template Variables:**
- `Token` - The OTP code (this is the most important one!)

---

### 4. **Authentication → Rate Limits** (Important!)

Go to: `Supabase Dashboard → Settings → API → Rate Limits`

**Default Rate Limits (Free Tier):**
- **OTP Emails**: 4 emails per hour per email address
- **Cannot be increased on free tier**

**Rate Limit Behavior:**
- If a user requests more than 4 OTP codes in 1 hour, they'll get a rate limit error
- The app shows a 5-minute cooldown timer after rate limit is hit
- Users must wait before requesting another code

**Note:** To increase rate limits, you need to upgrade to a paid Supabase plan.

---

### 5. **Custom SMTP (Optional but Recommended)**

Go to: `Supabase Dashboard → Settings → Auth → SMTP Settings`

**Why use Custom SMTP?**
- Higher email deliverability rates
- Custom email sender address
- Better email reputation
- Can handle more emails per hour (depends on your SMTP provider)

**Configure Custom SMTP:**

1. **Enable Custom SMTP**: TURN ON
2. **SMTP Host**: Your SMTP server (e.g., `smtp.gmail.com`, `smtp.sendgrid.net`)
3. **SMTP Port**: Usually `587` (TLS) or `465` (SSL)
4. **SMTP User**: Your SMTP username/email
5. **SMTP Password**: Your SMTP password or API key
6. **Sender Email**: Email address that sends OTP emails
7. **Sender Name**: Display name (e.g., "ResurrectCI")

**Popular SMTP Providers:**
- **SendGrid**: 100 emails/day free, easy setup
- **Mailgun**: 5000 emails/month free
- **AWS SES**: Very cheap, pay-per-email
- **Gmail**: Free, but has rate limits

**Example SendGrid Configuration:**
```
SMTP Host: smtp.sendgrid.net
SMTP Port: 587
SMTP User: apikey
SMTP Password: [Your SendGrid API Key]
Sender Email: noreply@yourdomain.com
Sender Name: ResurrectCI
```

---

### 6. **Environment Variables (Your Code)**

Make sure your `.env` file has:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=your-anon-key
```

**Where to find these:**
- Go to `Supabase Dashboard → Settings → API`
- Copy `Project URL` → `VITE_SUPABASE_URL`
- Copy `anon public` key → `VITE_SUPABASE_PUBLISHABLE_KEY`

---

## 🔧 Testing Your Configuration

### Test OTP Flow:

1. **Signup Test:**
   - Go to your app signup page
   - Enter email and password
   - Click "Create Account"
   - Check your email for OTP code
   - Enter OTP code
   - Should redirect to dashboard

2. **Check Email Delivery:**
   - Check spam/junk folder if email doesn't arrive
   - Check Supabase Dashboard → Logs → Auth Logs for errors
   - Check email provider logs if using Custom SMTP

3. **Rate Limit Test:**
   - Try requesting 5+ OTP codes in 1 hour
   - Should see rate limit error message
   - Should see cooldown timer in UI

---

## 🐛 Common Issues & Solutions

### Issue 1: "Email rate limit exceeded"
**Solution:** 
- Wait 1 hour between OTP requests
- Upgrade to paid Supabase plan for higher limits
- Use Custom SMTP (may have higher limits)

### Issue 2: "OTP emails not arriving"
**Solution:**
- Check spam/junk folder
- Verify email templates are configured
- Check Supabase Auth Logs for errors
- Try using Custom SMTP
- Verify email address is correct

### Issue 3: "Invalid OTP code"
**Solution:**
- Make sure OTP code is entered within 1 hour (default expiry)
- OTP codes are single-use (each code can only be used once)
- Check if user is copy-pasting code correctly (no extra spaces)

### Issue 4: "User already exists" error
**Solution:**
- User already has an account → they should use "Login" instead
- If they forgot password, implement password reset flow

### Issue 5: "Redirect URL mismatch"
**Solution:**
- Add your app URLs to `Authentication → URL Configuration → Redirect URLs`
- Make sure Site URL matches your app URL

---

## 📊 Supabase Dashboard Checklist

Use this checklist to verify all settings:

- [ ] Email provider is enabled
- [ ] Email signup is enabled
- [ ] OTP/Magic Link email template is configured
- [ ] Site URL is set correctly
- [ ] Redirect URLs are added (including `/**` pattern)
- [ ] Environment variables are set in your `.env` file
- [ ] (Optional) Custom SMTP is configured
- [ ] Test signup flow works end-to-end
- [ ] Test OTP email arrives in inbox (check spam too)
- [ ] Test rate limiting shows proper error messages

---

## 🚀 Production Checklist

Before going to production:

1. **Update URLs:**
   - Change Site URL to production domain
   - Add production redirect URLs
   - Update `.env` files for production

2. **Configure Custom SMTP:**
   - Don't rely on default Supabase email (limited)
   - Set up SendGrid, Mailgun, or AWS SES
   - Test email delivery rates

3. **Monitor Rate Limits:**
   - Consider upgrading Supabase plan if needed
   - Monitor Auth Logs for rate limit errors
   - Set up alerts for high error rates

4. **Test Thoroughly:**
   - Test signup flow
   - Test login flow
   - Test OTP resend
   - Test rate limiting
   - Test on different email providers (Gmail, Outlook, etc.)

---

## 📚 Additional Resources

- [Supabase Auth Documentation](https://supabase.com/docs/guides/auth)
- [Supabase Email Templates](https://supabase.com/docs/guides/auth/auth-email-templates)
- [Supabase Rate Limits](https://supabase.com/docs/guides/platform/rate-limits)
- [Supabase SMTP Configuration](https://supabase.com/docs/guides/auth/auth-smtp)

---

**Need Help?** 
- Check Supabase Dashboard → Logs → Auth Logs for detailed error messages
- Verify your configuration matches this guide
- Test with a different email address
- Check browser console for JavaScript errors


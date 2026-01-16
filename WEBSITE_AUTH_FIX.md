# Website Authentication Fix Guide

## 🔍 The Problem

Your mobile apps authenticate successfully:
- ✅ iOS app with Apple Sign-In works
- ✅ Android app with Google Sign-In works
- ❌ **Website authentication fails for both Apple and Google**

Since nothing was changed in your code, this suggests **OAuth credentials or configuration may have expired or been modified**.

---

## 🎯 Root Cause Analysis

When mobile apps work but the website doesn't, the most common causes are:

1. **Separate OAuth Apps Required**: Website OAuth apps are different from mobile app OAuth apps
   - Mobile apps use deep links: `padelpals://auth/callback`
   - Website uses HTTP redirects: `https://www.padelpals.app/auth-callback.html`
   - These require **separate OAuth Client IDs** in Google/Apple consoles

2. **Expired or Rotated Credentials**: OAuth credentials may have been regenerated or expired
   - Google OAuth Client Secrets can expire or be rotated
   - Apple Secret Keys (.p8 files) may have expired
   - Supabase configuration wasn't updated with new credentials

3. **Redirect URI Mismatch**: The redirect URI in Google/Apple doesn't match what Supabase expects

---

## ✅ Step-by-Step Fix

### Step 1: Diagnose the Issue

1. **Visit the diagnostic tool**:
   ```
   https://www.padelpals.app/oauth-diagnostic.html
   ```

2. **Click "Run Full Diagnostic"** to see what's failing

3. **Check for specific errors**:
   - `Unable to exchange external code` → OAuth credentials mismatch
   - `Invalid redirect_uri` → Redirect URI not configured correctly
   - `Provider not enabled` → Provider not enabled in Supabase

---

### Step 2: Fix Google OAuth

#### 2.1: Check Google Cloud Console

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select your project
3. Navigate to **APIs & Services** → **Credentials**
4. Find your **OAuth 2.0 Client IDs**

   ⚠️ **IMPORTANT**: You may have multiple OAuth clients:
   - One for Android app
   - One for iOS app  
   - **One for website** ← This is the one you need!

5. If you don't have a website OAuth client, **create one**:
   - Click **+ CREATE CREDENTIALS** → **OAuth client ID**
   - Application type: **Web application**
   - Name: "Padel Pals Website" (or similar)
   - **Authorized redirect URIs**: Add this EXACT URL:
     ```
     https://peaphqbxdmknxzsfdxuh.supabase.co/auth/v1/callback
     ```
   - Click **CREATE**
   - **Copy the Client ID and Client Secret** immediately

#### 2.2: Update Supabase with Google Credentials

1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project
3. Navigate to **Authentication** → **Providers**
4. Click on **Google**
5. Enter the credentials from Step 2.1:
   - **Client ID (for OAuth)**: Paste the Client ID from Google Cloud Console
   - **Client Secret (for OAuth)**: Paste the Client Secret from Google Cloud Console
6. **Enable Google**: Toggle the switch ON
7. Click **Save**

#### 2.3: Verify Redirect URI in Google

Go back to Google Cloud Console and verify:
- ✅ The redirect URI `https://peaphqbxdmknxzsfdxuh.supabase.co/auth/v1/callback` is listed
- ✅ It matches EXACTLY (including https://, no trailing slash)

---

### Step 3: Fix Apple OAuth

#### 3.1: Check Apple Developer Portal

1. Go to [Apple Developer Portal](https://developer.apple.com/account/)
2. Navigate to **Certificates, Identifiers & Profiles**
3. Click **Identifiers** → **Services IDs**

   ⚠️ **IMPORTANT**: You may have multiple Services IDs:
   - One for iOS app bundle ID
   - **One for website domain** ← This is the one you need!

4. Find your website Services ID (or create one):
   - Services ID should be associated with your website domain
   - Configure it with:
     - **Return URLs**: Must include:
       ```
       https://peaphqbxdmknxzsfdxuh.supabase.co/auth/v1/callback
       ```
     - **Domains**: Must include `supabase.co`

#### 3.2: Get Apple Secret Key

1. In Apple Developer Portal, go to **Keys**
2. Find or create a key with **Sign in with Apple** capability enabled
3. **Download the .p8 file** (only available once!)
4. **Note the Key ID** (shown when creating/downloading)
5. **Note your Team ID** (found in top right of developer portal)

#### 3.3: Update Supabase with Apple Credentials

1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Navigate to **Authentication** → **Providers**
3. Click on **Apple**
4. Enter all the credentials:
   - **Services ID (Client ID)**: From Apple Developer Portal (Step 3.1)
   - **Secret Key**: Open the .p8 file and copy its entire contents
   - **Key ID**: From Apple Developer Portal (Step 3.2)
   - **Team ID**: From Apple Developer Portal (Step 3.2)
5. **Enable Apple**: Toggle the switch ON
6. Click **Save**

#### 3.4: Verify Return URL in Apple

Go back to Apple Developer Portal and verify:
- ✅ The Services ID has return URL: `https://peaphqbxdmknxzsfdxuh.supabase.co/auth/v1/callback`
- ✅ Domain includes `supabase.co`

---

### Step 4: Verify Supabase URL Configuration

1. In Supabase Dashboard, go to **Authentication** → **URL Configuration**
2. Verify these settings:

   **Site URL:**
   ```
   https://www.padelpals.app
   ```

   **Redirect URLs** (should include):
   ```
   https://www.padelpals.app/auth-callback.html
   https://www.padelpals.app/*
   ```

3. Click **Save**

---

### Step 5: Test the Fix

1. **Wait 5-10 minutes** for changes to propagate (important!)

2. **Clear browser storage**:
   - Visit `https://www.padelpals.app/oauth-diagnostic.html`
   - Click **Clear All Data**
   - Or manually clear:
     ```javascript
     localStorage.clear();
     sessionStorage.clear();
     ```

3. **Test authentication**:
   - Go to `https://www.padelpals.app/auth.html`
   - Try signing in with Google
   - Try signing in with Apple
   - Both should work now!

4. **Re-run diagnostic**:
   - Visit `https://www.padelpals.app/oauth-diagnostic.html`
   - Click **Run Full Diagnostic**
   - All tests should pass ✅

---

## 🔑 Key Points to Remember

### Critical Redirect URI

The redirect URI configured in Google/Apple **must** be:
```
https://peaphqbxdmknxzsfdxuh.supabase.co/auth/v1/callback
```

**NOT**:
```
https://www.padelpals.app/auth-callback.html  ❌
```

This is because:
1. OAuth provider (Google/Apple) redirects to Supabase first
2. Supabase exchanges the code for tokens
3. Supabase then redirects to your website callback URL

### Separate OAuth Apps

- **Mobile apps** use different OAuth credentials (with deep link redirects)
- **Website** uses different OAuth credentials (with HTTP redirects)
- Make sure Supabase is configured with the **website OAuth credentials**, not mobile app credentials

### Credential Types

**Google:**
- Client ID (public, can be shared)
- Client Secret (private, must match exactly)

**Apple:**
- Services ID (public identifier)
- Secret Key (.p8 file contents - must match exactly)
- Key ID (identifier for the key)
- Team ID (your Apple Developer Team ID)

---

## 🐛 Common Issues & Solutions

### Issue: "Unable to exchange external code"

**Cause**: OAuth credentials in Supabase don't match Google/Apple

**Fix**:
1. Verify Client ID/Secret in Supabase matches Google Cloud Console exactly
2. For Apple, verify Secret Key (.p8) contents match exactly
3. Check that credentials haven't been regenerated

### Issue: "Invalid redirect_uri"

**Cause**: Redirect URI not configured in provider console

**Fix**:
1. Add `https://peaphqbxdmknxzsfdxuh.supabase.co/auth/v1/callback` to Google/Apple console
2. Ensure exact match (no trailing slash, correct protocol)

### Issue: Provider not enabled

**Cause**: Provider disabled in Supabase

**Fix**:
1. Go to Supabase Dashboard → Authentication → Providers
2. Enable the provider toggle
3. Save

### Issue: Still not working after update

**Solutions**:
1. Wait 10-15 minutes (propagation delay)
2. Clear all browser storage
3. Try in incognito/private window
4. Check Supabase logs: Dashboard → Logs → Auth Logs
5. Verify you're using website OAuth credentials, not mobile app credentials

---

## 📋 Quick Checklist

### Google OAuth:
- [ ] Website OAuth Client ID exists in Google Cloud Console
- [ ] Redirect URI `https://peaphqbxdmknxzsfdxuh.supabase.co/auth/v1/callback` is configured
- [ ] Client ID in Supabase = Client ID in Google Cloud Console
- [ ] Client Secret in Supabase = Client Secret in Google Cloud Console
- [ ] Google provider is **Enabled** in Supabase
- [ ] Waited 5-10 minutes after updating

### Apple OAuth:
- [ ] Website Services ID exists in Apple Developer Portal
- [ ] Return URL `https://peaphqbxdmknxzsfdxuh.supabase.co/auth/v1/callback` is configured
- [ ] Services ID in Supabase = Services ID in Apple Developer Portal
- [ ] Secret Key (.p8) in Supabase = Contents of .p8 file
- [ ] Key ID in Supabase = Key ID from Apple Developer Portal
- [ ] Team ID in Supabase = Team ID from Apple Developer Portal
- [ ] Apple provider is **Enabled** in Supabase
- [ ] Waited 5-10 minutes after updating

### Supabase Configuration:
- [ ] Site URL: `https://www.padelpals.app`
- [ ] Redirect URL: `https://www.padelpals.app/auth-callback.html` is listed
- [ ] Both providers (Google & Apple) are enabled

---

## 🔗 Useful Links

- **Diagnostic Tool**: `https://www.padelpals.app/oauth-diagnostic.html`
- **Supabase Dashboard**: https://supabase.com/dashboard
- **Google Cloud Console**: https://console.cloud.google.com/
- **Apple Developer Portal**: https://developer.apple.com/account/

---

## 📞 Still Having Issues?

If you've completed all steps and it's still not working:

1. **Check Supabase Auth Logs**:
   - Supabase Dashboard → Logs → Auth Logs
   - Look for specific error messages

2. **Use the Diagnostic Tool**:
   - Visit `https://www.padelpals.app/oauth-diagnostic.html`
   - Share the error messages shown

3. **Verify Credentials Match Exactly**:
   - Copy/paste credentials (don't type manually)
   - Check for extra spaces or hidden characters
   - Verify you're using website credentials, not mobile app credentials

4. **Create Fresh Credentials**:
   - Sometimes it's easier to create new OAuth credentials for the website
   - This ensures no hidden configuration issues

---

**Last Updated**: Based on current website authentication setup

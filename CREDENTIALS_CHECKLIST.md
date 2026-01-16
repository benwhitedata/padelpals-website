# OAuth Credentials Verification Checklist

## 🔍 Current Status

Your diagnostic shows:
- ✅ Configuration loaded correctly
- ✅ Supabase connection working
- ✅ OAuth URLs generating successfully
- ❌ **Authentication still failing** (likely during OAuth callback)

This means the initial OAuth setup is working, but **credentials mismatch** is preventing the callback from completing.

---

## 📋 Step-by-Step Verification

### Google OAuth Checklist

#### Step 1: Verify Google Cloud Console Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select your project
3. Navigate to **APIs & Services** → **Credentials**
4. Look for **OAuth 2.0 Client IDs**

   **IMPORTANT**: You need a **Web application** client (not Android/iOS)

5. For each Web application OAuth client, check:

   **✅ Authorized redirect URIs must include:**
   ```
   https://peaphqbxdmknxzsfdxuh.supabase.co/auth/v1/callback
   ```

   **❌ DO NOT include:**
   - `https://www.padelpals.app/auth-callback.html` (this is for your website, not Google)

6. **Copy these values** (you'll need them for Step 2):
   - **Client ID**: (looks like `123456789-abcdefg.apps.googleusercontent.com`)
   - **Client Secret**: (looks like `GOCSPX-...`)

#### Step 2: Verify Supabase Google Configuration

1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project: `peaphqbxdmknxzsfdxuh`
3. Navigate to **Authentication** → **Providers**
4. Click on **Google**

   **Verify these match EXACTLY:**

   - **Client ID (for OAuth)**: Must match Google Cloud Console Client ID
   - **Client Secret (for OAuth)**: Must match Google Cloud Console Client Secret

5. **Check the toggle**: Is Google **Enabled**? (should be ON)

6. If they don't match:
   - Copy Client ID from Google Cloud Console → Paste in Supabase
   - Copy Client Secret from Google Cloud Console → Paste in Supabase
   - Click **Save**
   - Wait 5-10 minutes

#### Step 3: Test Google OAuth

1. Clear browser storage:
   ```javascript
   localStorage.clear();
   sessionStorage.clear();
   ```

2. Visit: `https://www.padelpals.app/auth.html`

3. Click **Sign in with Google**

4. After authorizing, check if you're redirected back successfully

---

### Apple OAuth Checklist

#### Step 1: Verify Apple Developer Portal Setup

1. Go to [Apple Developer Portal](https://developer.apple.com/account/)
2. Navigate to **Certificates, Identifiers & Profiles**
3. Click **Identifiers** → **Services IDs**

   **IMPORTANT**: Find the Services ID for your **website** (not the iOS app bundle ID)

4. Click on the Services ID for your website

5. Scroll to **Sign in with Apple** section

   **✅ Return URLs must include:**
   ```
   https://peaphqbxdmknxzsfdxuh.supabase.co/auth/v1/callback
   ```

   **✅ Domains must include:**
   ```
   supabase.co
   ```

6. Note your **Services ID** (this is your Client ID)

#### Step 2: Get Apple Secret Key

1. In Apple Developer Portal, go to **Keys**

2. Find the key that has **Sign in with Apple** enabled

   **If you don't have one or it's expired:**
   - Click **+** to create a new key
   - Enable **Sign in with Apple**
   - Click **Configure** → Select your app identifier
   - Click **Save** → **Continue** → **Register**
   - **Download the .p8 file** (only available once!)

3. **Open the .p8 file** and copy its entire contents (this is your Secret Key)

4. Note the **Key ID** (shown when you download the key)

5. Note your **Team ID** (found in top right of Apple Developer Portal)

#### Step 3: Verify Supabase Apple Configuration

1. In Supabase Dashboard, go to **Authentication** → **Providers**
2. Click on **Apple**

   **Verify these match EXACTLY:**

   - **Services ID (Client ID)**: Must match Apple Developer Portal Services ID
   - **Secret Key**: Must match contents of .p8 file (entire file contents)
   - **Key ID**: Must match Key ID from Apple Developer Portal
   - **Team ID**: Must match Team ID from Apple Developer Portal

3. **Check the toggle**: Is Apple **Enabled**? (should be ON)

4. If they don't match:
   - Copy Services ID from Apple Developer Portal → Paste in Supabase
   - Copy entire .p8 file contents → Paste in Supabase Secret Key
   - Copy Key ID → Paste in Supabase
   - Copy Team ID → Paste in Supabase
   - Click **Save**
   - Wait 5-10 minutes

#### Step 4: Test Apple OAuth

1. Clear browser storage:
   ```javascript
   localStorage.clear();
   sessionStorage.clear();
   ```

2. Visit: `https://www.padelpals.app/auth.html`

3. Click **Sign in with Apple**

4. After authorizing, check if you're redirected back successfully

---

## 🚨 Common Issues

### Issue 1: "Unable to exchange external code"

**Cause**: OAuth credentials in Supabase don't match Google/Apple

**Fix**: 
- Verify Client ID matches exactly (no spaces, correct format)
- Verify Client Secret matches exactly (especially for Google - check for typos)
- For Apple, verify Secret Key is the entire .p8 file contents (not just the Key ID)

### Issue 2: "Invalid redirect_uri"

**Cause**: Redirect URI not configured in provider console

**Fix**:
- Google: Add `https://peaphqbxdmknxzsfdxuh.supabase.co/auth/v1/callback` to Authorized redirect URIs
- Apple: Add `https://peaphqbxdmknxzsfdxuh.supabase.co/auth/v1/callback` to Return URLs

### Issue 3: Using Mobile App Credentials

**Cause**: Using iOS/Android OAuth credentials instead of website credentials

**Fix**:
- Make sure you're using **Web application** OAuth client for Google
- Make sure you're using **Services ID** for website (not iOS app bundle ID) for Apple

### Issue 4: Secret Key Expired (Apple)

**Cause**: Apple Secret Key (.p8) has expired or was regenerated

**Fix**:
- Create a new key in Apple Developer Portal
- Download the new .p8 file
- Update Supabase with new Secret Key, Key ID, and Team ID

---

## 🔧 Quick Verification Script

Run this in your browser console after trying to sign in:

```javascript
// Check for OAuth errors in localStorage
Object.keys(localStorage).filter(k => k.includes('auth') || k.includes('supabase')).forEach(k => {
    const val = localStorage.getItem(k);
    if (val && (val.includes('error') || val.includes('code') || val.includes('exchange'))) {
        console.log(k, ':', val);
    }
});

// Check current URL for OAuth errors
const params = new URLSearchParams(window.location.search);
const hashParams = new URLSearchParams(window.location.hash.substring(1));
if (params.get('error') || hashParams.get('error')) {
    console.error('OAuth Error:', params.get('error') || hashParams.get('error'));
    console.error('Error Description:', params.get('error_description') || hashParams.get('error_description'));
}
```

---

## ✅ Final Checklist

Before testing again, verify:

### Google:
- [ ] Website OAuth Client ID exists in Google Cloud Console (Web application type)
- [ ] Redirect URI `https://peaphqbxdmknxzsfdxuh.supabase.co/auth/v1/callback` is in Authorized redirect URIs
- [ ] Client ID in Supabase = Client ID in Google Cloud Console (exact match)
- [ ] Client Secret in Supabase = Client Secret in Google Cloud Console (exact match)
- [ ] Google provider is **Enabled** in Supabase
- [ ] Waited 5-10 minutes after updating

### Apple:
- [ ] Website Services ID exists in Apple Developer Portal
- [ ] Return URL `https://peaphqbxdmknxzsfdxuh.supabase.co/auth/v1/callback` is configured
- [ ] Domain `supabase.co` is configured
- [ ] Secret Key (.p8 file) is not expired
- [ ] Services ID in Supabase = Services ID in Apple Developer Portal (exact match)
- [ ] Secret Key in Supabase = Entire .p8 file contents (exact match)
- [ ] Key ID in Supabase = Key ID from Apple Developer Portal (exact match)
- [ ] Team ID in Supabase = Team ID from Apple Developer Portal (exact match)
- [ ] Apple provider is **Enabled** in Supabase
- [ ] Waited 5-10 minutes after updating

### General:
- [ ] Cleared browser storage before testing
- [ ] Testing in incognito/private window to rule out cache issues
- [ ] Checked Supabase Auth Logs for specific error messages

---

## 📊 After Verification

Once you've verified all credentials match:

1. **Clear browser storage**:
   ```javascript
   localStorage.clear();
   sessionStorage.clear();
   ```

2. **Test in incognito/private window** to rule out cache issues

3. **Try signing in again** at `https://www.padelpals.app/auth.html`

4. **Check Supabase Auth Logs**:
   - Go to Supabase Dashboard → Logs → Auth Logs
   - Look for specific error messages that indicate what's failing

5. If still not working, check the **browser console** (F12) for errors during the OAuth flow

---

**Last Updated**: Based on diagnostic results showing OAuth URLs generate successfully but authentication still fails

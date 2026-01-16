# Fix: "Unable to exchange external code" Error

## The Problem

**Error:** `server_error - Unable to exchange external code`

**What this means:**
- ✅ Google/Apple successfully authorized you
- ✅ They returned an authorization code
- ❌ **Supabase cannot exchange that code for tokens**

This happens when the **OAuth credentials in Supabase don't match** what's registered with Google/Apple.

---

## 🔍 Root Cause

The OAuth Client ID and Secret in your Supabase Dashboard must **exactly match** what's configured in:

- **Google Cloud Console** (for Google OAuth)
- **Apple Developer Console** (for Apple OAuth)

If they don't match, you get this error.

---

## ✅ Solution Steps

### **For Google OAuth:**

#### Step 1: Get Your Google OAuth Credentials

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select your project (or create one)
3. Go to **APIs & Services** → **Credentials**
4. Find your OAuth 2.0 Client ID (or create one)
5. **Copy the Client ID and Client Secret**

#### Step 2: Check Authorized Redirect URIs in Google

In the same OAuth Client configuration:

**Authorized redirect URIs MUST include:**
```
https://peaphqbxdmknxzsfdxuh.supabase.co/auth/v1/callback
```

⚠️ **IMPORTANT:** This is Supabase's callback URL, NOT your website URL!

#### Step 3: Update Supabase with Google Credentials

1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project
3. Go to **Authentication** → **Providers**
4. Click on **Google**
5. **Verify these match EXACTLY:**
   - **Client ID:** Must match Google Cloud Console
   - **Client Secret:** Must match Google Cloud Console
6. **Enable Google:** Toggle ON
7. **Save**

---

### **For Apple OAuth:**

#### Step 1: Get Your Apple OAuth Credentials

1. Go to [Apple Developer Portal](https://developer.apple.com/account/)
2. Go to **Certificates, Identifiers & Profiles**
3. Go to **Identifiers** → **Services IDs**
4. Find your Services ID (or create one)
5. Configure it with:
   - **Return URLs:** Must include `https://peaphqbxdmknxzsfdxuh.supabase.co/auth/v1/callback`
   - **Domains:** Must include `supabase.co`

#### Step 2: Create/Get Secret Key

1. In Apple Developer Portal, go to **Keys**
2. Create a new key (or use existing) with **Sign in with Apple** enabled
3. Download the **Key (.p8 file)**
4. Note the **Key ID**
5. Note your **Team ID** (top right of developer portal)

#### Step 3: Update Supabase with Apple Credentials

1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project
3. Go to **Authentication** → **Providers**
4. Click on **Apple**
5. **Fill in ALL fields:**
   - **Services ID (Client ID):** From Apple Developer Portal
   - **Secret Key:** Contents of the .p8 file (or the key itself)
   - **Key ID:** From Apple Developer Portal
   - **Team ID:** From Apple Developer Portal
6. **Enable Apple:** Toggle ON
7. **Save**

---

## 🚨 Common Mistakes

### Mistake 1: Using Website URL Instead of Supabase Callback

❌ **WRONG redirect URI:**
```
https://www.padelpals.app/auth-callback.html
```

✅ **CORRECT redirect URI:**
```
https://peaphqbxdmknxzsfdxuh.supabase.co/auth/v1/callback
```

### Mistake 2: Client ID/Secret Mismatch

- **Google Cloud Console Client ID** ≠ **Supabase Google Client ID**
- **Apple Services ID** ≠ **Supabase Apple Services ID**

**Fix:** Copy the EXACT values from provider console to Supabase.

### Mistake 3: Using Mobile App Credentials

If you have separate OAuth apps for:
- 📱 Mobile app (`padelpals://auth/callback`)
- 🌐 Website (`https://www.padelpals.app`)

Make sure Supabase uses the **website OAuth app credentials**, not the mobile ones.

### Mistake 4: Missing or Wrong Secret Key (Apple)

- Must be the **Secret Key** (contents of .p8 file), not the Key ID
- Must match the key that has **Sign in with Apple** enabled

---

## 🔧 Quick Verification Checklist

### Google OAuth:
- [ ] Client ID in Supabase = Client ID in Google Cloud Console
- [ ] Client Secret in Supabase = Client Secret in Google Cloud Console  
- [ ] Google Cloud Console has redirect URI: `https://peaphqbxdmknxzsfdxuh.supabase.co/auth/v1/callback`
- [ ] Google provider is **Enabled** in Supabase

### Apple OAuth:
- [ ] Services ID in Supabase = Services ID in Apple Developer Portal
- [ ] Secret Key in Supabase = Contents of .p8 key file
- [ ] Key ID in Supabase = Key ID from Apple Developer Portal
- [ ] Team ID in Supabase = Team ID from Apple Developer Portal
- [ ] Apple Services ID has return URL: `https://peaphqbxdmknxzsfdxuh.supabase.co/auth/v1/callback`
- [ ] Apple provider is **Enabled** in Supabase

---

## 🧪 Test After Fix

1. Clear browser storage:
   ```javascript
   localStorage.clear();
   sessionStorage.clear();
   ```

2. Try signing in again

3. Should now work! ✅

---

## 💡 Why This Happened

Since it **worked before** but **doesn't now**, possible causes:

1. **OAuth credentials were regenerated** in Google/Apple but not updated in Supabase
2. **Multiple OAuth apps** - wrong one is configured
3. **Supabase project credentials** were reset/changed
4. **Provider console settings** changed (redirect URIs modified)

---

## 📞 Still Not Working?

If you've verified everything matches and it still doesn't work:

1. **Double-check you're using the website OAuth app**, not the mobile app
2. **Create fresh OAuth credentials** for the website specifically
3. **Wait 5-10 minutes** after saving changes (propagation delay)
4. **Check Supabase logs**: Dashboard → Logs → Auth Logs

The error message should now show which provider failed, making it easier to fix!

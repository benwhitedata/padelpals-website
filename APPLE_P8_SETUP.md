# Apple .p8 Key Setup Guide

## 🎯 What You Have

You've created a new **.p8 key** for Apple Sign In web login. This is the **Secret Key** that Supabase needs to authenticate with Apple on your behalf.

---

## 📋 Step-by-Step: Configure in Supabase

### Step 1: Get Your Apple Developer Information

Before configuring Supabase, collect these from Apple Developer Portal:

1. **Open the .p8 file** (downloaded when you created the key)
   - This contains your **Secret Key** (the entire contents of the file)

2. **Note your Key ID**
   - Found in Apple Developer Portal → Keys → Select your key
   - Shows as something like: `ABC123XYZ`
   - **Copy this exactly**

3. **Note your Team ID**
   - Found in top right of Apple Developer Portal
   - Shows as something like: `DEF456UVW`
   - **Copy this exactly**

4. **Note your Services ID (Client ID)**
   - Go to Apple Developer Portal → Certificates, Identifiers & Profiles
   - Click **Identifiers** → **Services IDs**
   - Find your website Services ID (not the iOS app bundle ID)
   - **Copy this exactly** (something like: `com.yourcompany.padelpals.web`)

---

### Step 2: Configure Services ID Return URL

**IMPORTANT:** Your Services ID must have the correct return URL configured:

1. In Apple Developer Portal → Identifiers → Services IDs
2. Click on your **website Services ID**
3. Scroll to **Sign in with Apple** section
4. Click **Configure**
5. **Return URLs** must include:
   ```
   https://peaphqbxdmknxzsfdxuh.supabase.co/auth/v1/callback
   ```
6. **Domains** must include:
   ```
   supabase.co
   ```
7. Click **Save**

⚠️ **CRITICAL:** This must be the Supabase callback URL, NOT your website URL!

---

### Step 3: Configure Supabase Dashboard

1. **Go to Supabase Dashboard**
   - Visit: https://supabase.com/dashboard
   - Select your project: `peaphqbxdmknxzsfdxuh`

2. **Navigate to Authentication → Providers**
   - Left sidebar → **Authentication**
   - Click **Providers** tab

3. **Click on "Apple" provider**

4. **Look for ALL fields** (may need to scroll or expand):
   - If you only see **"Secret Key (for OAuth)"**, look for additional fields below or expand sections
   - Supabase typically requires these fields:
     - **Services ID** (or **Client ID**)
     - **Secret Key (for OAuth)** ← This is where your .p8 contents go
     - **Key ID**
     - **Team ID**

5. **Fill in the Secret Key field:**
   ```
   Open your .p8 file in a text editor
   Copy the ENTIRE contents of the file
   (Including -----BEGIN PRIVATE KEY----- and -----END PRIVATE KEY-----)
   Paste into the "Secret Key (for OAuth)" field
   ```

   **Example of what the .p8 file looks like:**
   ```
   -----BEGIN PRIVATE KEY-----
   MIGTAgEAMBMGByqGSM49AgEGCCqGSM49AwEHBHkwdwIBAQQg...
   (many lines of encoded key data)
   ...ABC123xyz==
   -----END PRIVATE KEY-----
   ```

   **Important:** Copy everything from `-----BEGIN PRIVATE KEY-----` to `-----END PRIVATE KEY-----` (inclusive)

6. **If there are additional fields, fill them in:**
   - **Services ID / Client ID:** Your Services ID from Step 1.4
   - **Key ID:** Your Key ID from Step 1.2
   - **Team ID:** Your Team ID from Step 1.3

7. **Enable Apple:**
   - Toggle the switch to **ON** (if there's an enable toggle)

8. **Click "Save"** or **"Update"**

**Note:** If Supabase only shows the Secret Key field, it may auto-detect the other values from the .p8 file or use them from elsewhere. In that case, just paste the entire .p8 file contents into the Secret Key field.

---

## ✅ Verification Checklist

Before testing, verify:

- [ ] **Secret Key pasted:** Entire .p8 file contents (including BEGIN/END markers) pasted into "Secret Key (for OAuth)"
- [ ] Return URL in Services ID includes: `https://peaphqbxdmknxzsfdxuh.supabase.co/auth/v1/callback`
- [ ] Domain in Services ID includes: `supabase.co`
- [ ] Apple provider is **Enabled** in Supabase (toggle is ON, if shown)

**If Supabase shows additional fields (Services ID, Key ID, Team ID):**
- [ ] Services ID in Supabase = Services ID in Apple Developer Portal (exact match)
- [ ] Key ID in Supabase = Key ID from Apple Developer Portal (exact match)
- [ ] Team ID in Supabase = Team ID from Apple Developer Portal (exact match)

---

## 🔍 What Each Field Does

### Secret Key (.p8 file contents) - REQUIRED
- **What it is:** The private key that allows Supabase to authenticate with Apple
- **Where to find:** The .p8 file you downloaded (entire file contents)
- **Format:** Includes `-----BEGIN PRIVATE KEY-----` and `-----END PRIVATE KEY-----`
- **Important:** Copy the ENTIRE file contents, not just part of it
- **This is what you paste into "Secret Key (for OAuth)" in Supabase**

### Services ID (Client ID) - May be required
- **What it is:** Your website's identifier in Apple's system
- **Where to find:** Apple Developer Portal → Identifiers → Services IDs
- **Example:** `com.yourcompany.padelpals.web`
- **Note:** May be auto-detected from .p8 file if not shown as separate field

### Key ID - May be required
- **What it is:** Identifier for which key was used to generate the Secret Key
- **Where to find:** Apple Developer Portal → Keys → Select your key
- **Example:** `ABC123XYZ`
- **Note:** May be auto-detected from .p8 file if not shown as separate field

### Team ID - May be required
- **What it is:** Your Apple Developer Team identifier
- **Where to find:** Top right of Apple Developer Portal
- **Example:** `DEF456UVW`
- **Note:** May be auto-detected from .p8 file if not shown as separate field

---

## 🧪 Test After Configuration

1. **Wait 5-10 minutes** for changes to propagate

2. **Clear browser storage:**
   - Visit: https://www.padelpals.app/oauth-diagnostic.html
   - Click "Clear All Data"
   - Or manually: `localStorage.clear(); sessionStorage.clear();`

3. **Test authentication:**
   - Go to: https://www.padelpals.app/auth.html
   - Click "Sign in with Apple"
   - Complete the Apple authorization flow
   - Should redirect back successfully

4. **If it fails:**
   - Visit: https://www.padelpals.app/oauth-diagnostic.html
   - Click "Run Full Diagnostic"
   - Check Test #8 for specific error messages

---

## 🚨 Common Mistakes

### Mistake 1: Using Wrong Key ID
❌ **Wrong:** Using Key ID from a different key  
✅ **Correct:** Use Key ID from the key that generated your .p8 file

### Mistake 2: Incomplete Secret Key
❌ **Wrong:** Copying only part of the .p8 file (missing BEGIN/END markers or lines)  
✅ **Correct:** Copy the ENTIRE file contents from `-----BEGIN PRIVATE KEY-----` to `-----END PRIVATE KEY-----` (including these markers)
   - Open .p8 file in text editor (not Word)
   - Select ALL (Cmd/Ctrl+A)
   - Copy ALL (Cmd/Ctrl+C)
   - Paste into Supabase "Secret Key (for OAuth)" field

### Mistake 3: Wrong Services ID
❌ **Wrong:** Using iOS app bundle ID  
✅ **Correct:** Use the Services ID specifically for your website

### Mistake 4: Wrong Return URL
❌ **Wrong:** `https://www.padelpals.app/auth-callback.html`  
✅ **Correct:** `https://peaphqbxdmknxzsfdxuh.supabase.co/auth/v1/callback`

### Mistake 5: Missing Domain
❌ **Wrong:** Domain not configured in Services ID  
✅ **Correct:** Add `supabase.co` to Domains in Services ID configuration

---

## 💡 Quick Reference

**Supabase Dashboard:**
https://supabase.com/dashboard/project/peaphqbxdmknxzsfdxuh/auth/providers

**Apple Developer Portal:**
https://developer.apple.com/account/

**Required Return URL:**
```
https://peaphqbxdmknxzsfdxuh.supabase.co/auth/v1/callback
```

**Required Domain:**
```
supabase.co
```

---

## 🔧 Troubleshooting

### "Unable to exchange external code"
- **Cause:** Secret Key, Key ID, or Team ID mismatch
- **Fix:** Verify all fields match exactly between Supabase and Apple Developer Portal

### "Invalid redirect_uri"
- **Cause:** Return URL not configured correctly in Services ID
- **Fix:** Add `https://peaphqbxdmknxzsfdxuh.supabase.co/auth/v1/callback` to Return URLs

### "Invalid client"
- **Cause:** Services ID mismatch or not configured correctly
- **Fix:** Verify Services ID in Supabase matches Apple Developer Portal exactly

### Still not working?
1. Wait 10-15 minutes (propagation delay)
2. Double-check all fields match exactly (no extra spaces)
3. Verify Services ID Return URL is configured
4. Check Supabase Auth Logs: Dashboard → Logs → Auth Logs

---

**Last Updated:** Based on current Supabase and Apple configuration

# Fix: Apple OAuth "invalid_client" Error

## 🔴 Current Error

```
oauth2: "invalid_client"
500: Unable to exchange external code
```

**What this means:**
- ✅ Apple successfully authorized you
- ✅ Apple returned an authorization code
- ❌ **Supabase cannot exchange the code because Apple rejects the credentials**

This happens when the **credentials in Supabase don't match** what's configured in Apple Developer Portal.

---

## 🔍 Root Cause: New Key Not Properly Configured

You created a **NEW key** (`7X94CKX99M`) but Supabase might still be using the **OLD key** configuration (`LUDQJXUZU4`).

**The credentials must match EXACTLY:**
- **Secret Key:** Must be generated from the NEW key (`.p8` file)
- **Key ID:** Must be `7X94CKX99M` (NOT `LUDQJXUZU4`)
- **Team ID:** Must be `783NB5H5V4`
- **Services ID:** Must be `783NB5H5V4.com.playpadelpals.padelpals362`

---

## ✅ Step-by-Step Fix

### Step 1: Verify You Have the New .p8 File

1. **Check if you downloaded the `.p8` file** for key `7X94CKX99M`
   - ⚠️ **If you didn't download it, you can't get it again!** You'll need to create a new key.

2. **If you don't have the `.p8` file:**
   - Go to Apple Developer Portal → Keys
   - Check if the key is still downloadable (only available once!)
   - If not, you'll need to create a **NEW key** and download the `.p8` file immediately

### Step 2: Generate the Secret Key

1. **Go to:** https://supabase.com/docs/guides/auth/social-login/auth-apple
2. **Scroll to the secret generation tool** (use Chrome/Firefox, NOT Safari)
3. **Upload or paste your `.p8` file contents** (the NEW one from key `7X94CKX99M`)
   - Must include `-----BEGIN PRIVATE KEY-----` and `-----END PRIVATE KEY-----`
4. **Fill in:**
   - **Key ID:** `7X94CKX99M` ← **NEW KEY ID**
   - **Team ID:** `783NB5H5V4`
   - **Services ID:** `783NB5H5V4.com.playpadelpals.padelpals362`
5. **Click "Generate"**
6. **Copy the generated JWT secret** (starts with `eyJ...`)

### Step 3: Update Supabase Configuration

1. **Go to Supabase Dashboard**
   - https://supabase.com/dashboard/project/peaphqbxdmknxzsfdxuh/auth/providers
   - Navigate to **Authentication → Providers → Apple**

2. **Update ALL fields with the NEW key values:**

   **Secret Key (for OAuth):**
   - ❌ Remove: Any old secret key
   - ✅ Paste: The **NEW** generated JWT (starts with `eyJ...`) from Step 2

   **Services ID / Client ID:**
   - ✅ Should be: `783NB5H5V4.com.playpadelpals.padelpals362`

   **Key ID:**
   - ❌ **REMOVE:** `LUDQJXUZU4` (old key)
   - ✅ **UPDATE TO:** `7X94CKX99M` (new key)

   **Team ID:**
   - ✅ Should be: `783NB5H5V4`

   **Client IDs field:**
   - ❌ **REMOVE:** Any iOS bundle IDs like `com.playpadelpals.padelpals362.signin`
   - ✅ **ONLY:** `783NB5H5V4.com.playpadelpals.padelpals362`

3. **Enable Apple:** Toggle should be **ON**

4. **Click "Save"**

### Step 4: Verify Services ID Configuration in Apple

1. **Go to Apple Developer Portal**
   - https://developer.apple.com/account/resources/identifiers/list/serviceId
   - Find Services ID: `783NB5H5V4.com.playpadelpals.padelpals362`

2. **Click on the Services ID → "Sign in with Apple" → "Configure"**

3. **Verify:**
   - **Return URLs** includes: `https://peaphqbxdmknxzsfdxuh.supabase.co/auth/v1/callback`
   - **Domains** includes: `supabase.co`

4. **Save if you made any changes**

### Step 5: Wait and Test

1. **Wait 10-15 minutes** after saving changes (propagation delay)

2. **Clear browser storage:**
   ```javascript
   localStorage.clear();
   sessionStorage.clear();
   ```

3. **Test authentication:**
   - Go to: https://www.padelpals.app/auth.html
   - Click "Sign in with Apple"
   - Complete the authorization flow

4. **If it still fails:**
   - Check Supabase Auth Logs for specific error
   - Verify all fields match exactly (no typos, no extra spaces)

---

## 🚨 Common Mistakes

### Mistake 1: Using Old Key ID
❌ **Wrong:** Key ID is still `LUDQJXUZU4` (old key)  
✅ **Correct:** Key ID must be `7X94CKX99M` (new key)

### Mistake 2: Using Old Secret Key
❌ **Wrong:** Secret Key generated from old `.p8` file (key `LUDQJXUZU4`)  
✅ **Correct:** Secret Key must be generated from NEW `.p8` file (key `7X94CKX99M`)

### Mistake 3: Secret Key Format
❌ **Wrong:** Pasting raw `.p8` file contents directly  
✅ **Correct:** Use Supabase tool to generate JWT secret (starts with `eyJ...`)

### Mistake 4: Missing .p8 File
❌ **Wrong:** Can't find the `.p8` file for the new key  
✅ **Correct:** If you didn't download it, create a NEW key and download `.p8` immediately (only available once!)

---

## 🔍 Verification Checklist

Before testing again, verify **ALL** of these match **EXACTLY**:

### In Supabase Dashboard:
- [ ] Secret Key: **NEW** JWT generated from key `7X94CKX99M` (starts with `eyJ...`)
- [ ] Key ID: `7X94CKX99M` (NOT `LUDQJXUZU4`)
- [ ] Team ID: `783NB5H5V4`
- [ ] Services ID: `783NB5H5V4.com.playpadelpals.padelpals362`
- [ ] Client IDs: **ONLY** `783NB5H5V4.com.playpadelpals.padelpals362` (no iOS bundle IDs)
- [ ] Apple provider: **Enabled** (toggle ON)

### In Apple Developer Portal:
- [ ] Key `7X94CKX99M` exists and is enabled
- [ ] Key has "Sign in with Apple" enabled
- [ ] Services ID `783NB5H5V4.com.playpadelpals.padelpals362` exists
- [ ] Services ID Return URL: `https://peaphqbxdmknxzsfdxuh.supabase.co/auth/v1/callback`
- [ ] Services ID Domain: `supabase.co`

---

## 💡 Why This Happens

The `invalid_client` error occurs when:

1. **Key ID mismatch:** Supabase has `LUDQJXUZU4` but Apple expects `7X94CKX99M`
2. **Secret Key mismatch:** The secret was generated from the wrong key
3. **Services ID mismatch:** Wrong Services ID configured in Supabase
4. **Team ID mismatch:** Wrong Team ID in Supabase

**All four must match exactly** between Supabase and Apple Developer Portal.

---

## 🔧 If Still Not Working

1. **Double-check every field** - no typos, no extra spaces
2. **Verify you used the correct `.p8` file** - must be from key `7X94CKX99M`
3. **Check Supabase Auth Logs** - look for specific error details
4. **Wait 15-20 minutes** - propagation can take longer sometimes
5. **Try in incognito/private window** - rule out cache issues

---

**Last Updated:** Based on error `invalid_client` with new key `7X94CKX99M`

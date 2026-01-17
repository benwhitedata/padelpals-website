# How to Find the Correct Apple Services ID

## 🔍 Problem

The Services ID `783NB5H5V4.com.playpadelpals.padelpals362` is showing as **invalid client** in Supabase validation.

This means we need to find the **actual Services ID** that exists and is configured for web authentication in Apple Developer Portal.

---

## 📋 Step-by-Step: Find Your Services ID

### Step 1: Navigate to Services IDs in Apple Developer Portal

1. **Go to:** https://developer.apple.com/account/resources/identifiers/list/serviceId
   - Or: Apple Developer Portal → Certificates, Identifiers & Profiles → Identifiers → **Services IDs** (filter on the right)

2. **Look for Services IDs** configured with "Sign in with Apple"

### Step 2: Check Each Services ID

For each Services ID, click on it and check:

1. **Does it have "Sign in with Apple" enabled?**
   - Look for "Sign in with Apple" in the Capabilities list
   - Click "Configure" next to it

2. **What Return URLs are configured?**
   - Should include: `https://peaphqbxdmknxzsfdxuh.supabase.co/auth/v1/callback`
   - This is what makes it valid for web authentication

3. **What Domains are configured?**
   - Should include: `supabase.co`

### Step 3: Identify the Correct Services ID

The **correct Services ID** for web authentication should:
- ✅ Exist in Apple Developer Portal
- ✅ Have "Sign in with Apple" enabled and configured
- ✅ Have Return URL: `https://peaphqbxdmknxzsfdxuh.supabase.co/auth/v1/callback`
- ✅ Have Domain: `supabase.co`

**This is the Services ID you need to use** when generating the JWT secret key.

---

## 🔧 Common Services ID Formats

Services IDs can have different formats. Common ones include:

1. **With Team ID prefix:** `783NB5H5V4.com.playpadelpals.padelpals362`
2. **With .signin suffix:** `783NB5H5V4.com.playpadelpals.padelpals362.signin`
3. **With .web suffix:** `783NB5H5V4.com.padelpals.web`
4. **Simple format:** `com.playpadelpals.padelpals362.web`

**The format doesn't matter** - what matters is that it:
- ✅ Actually exists in Apple Developer Portal
- ✅ Is configured with the Supabase callback URL
- ✅ Is linked to your key (`7X94CKX99M`)

---

## ✅ Once You Find the Correct Services ID

1. **Note the exact Services ID** from Apple Developer Portal

2. **Regenerate the JWT secret key** using the Supabase tool:
   - Go to: https://supabase.com/docs/guides/auth/social-login/auth-apple
   - Use the **correct Services ID** (the one you just found)
   - Key ID: `7X94CKX99M`
   - Team ID: `783NB5H5V4`
   - .p8 file: From key `7X94CKX99M`

3. **Update Supabase:**
   - Services ID / Client ID: Use the **correct Services ID** (from Apple Developer Portal)
   - Secret Key: Paste the new JWT (generated with the correct Services ID)
   - Key ID: `7X94CKX99M`
   - Team ID: `783NB5H5V4`
   - Client IDs field: Services ID + iOS bundle IDs (comma-separated)

---

## 🚨 If No Services ID Has the Supabase Callback URL

If you can't find a Services ID with the Supabase callback URL configured:

1. **Create a new Services ID** or **edit an existing one**
2. **Configure "Sign in with Apple":**
   - Primary App ID: Select your app
   - Return URLs: Add `https://peaphqbxdmknxzsfdxuh.supabase.co/auth/v1/callback`
   - Domains: Add `supabase.co`
3. **Save the configuration**
4. **Use this Services ID** to generate the JWT

---

## 📝 Next Steps

1. **Find your Services IDs** in Apple Developer Portal
2. **Check which one has the Supabase callback URL configured**
3. **Share the Services ID** that's configured correctly
4. **We'll regenerate the JWT** with that Services ID
5. **Update all documentation** with the correct Client ID

---

**Important:** The Services ID you use to generate the JWT **MUST** match the Services ID configured in Apple Developer Portal with the Supabase callback URL. If they don't match, you'll get `invalid_client` errors.

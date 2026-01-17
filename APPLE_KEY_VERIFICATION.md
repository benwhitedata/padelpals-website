# Apple Key Configuration Verification

## ✅ Your New Key Details

Based on the information you provided:

- **Team ID (Account ID):** `783NB5H5V4` ✅ CORRECT
- **Services ID:** `783NB5H5V4.com.playpadelpals.padelpals362` ✅ CORRECT (Website Services ID)
- **Key ID:** `7X94CKX99M` ✅ NEW KEY (replacing old `LUDQJXUZU4`)

---

## 📋 Complete Verification Checklist

### Step 1: Verify Key Configuration in Apple Developer Portal

1. **Go to Apple Developer Portal → Keys**
2. **Click on your new key (Key ID: `7X94CKX99M`)**
3. **Verify:**
   - ✅ **Enabled Services:** Should show "Sign in with Apple"
   - ✅ **Key is NOT revoked** (should show as "Enabled")
   - ✅ **Key configuration** shows the Services ID `783NB5H5V4.com.playpadelpals.padelpals362` is associated

### Step 2: Verify Services ID Configuration

**CRITICAL:** Your Services ID must be configured correctly:

1. **Go to Apple Developer Portal → Certificates, Identifiers & Profiles → Identifiers → Services IDs**
2. **Click on:** `783NB5H5V4.com.playpadelpals.padelpals362`
3. **Click "Sign in with Apple" → "Configure"**
4. **Verify these settings:**

   **Primary App ID:**
   - Should be selected (this groups the Services ID with your app)

   **Return URLs MUST include:**
   ```
   https://peaphqbxdmknxzsfdxuh.supabase.co/auth/v1/callback
   ```
   ⚠️ **CRITICAL:** This is Supabase's callback URL, NOT your website URL!

   **Domains MUST include:**
   ```
   supabase.co
   ```

5. **Save if you made any changes**

### Step 3: Download and Generate Secret Key

1. **Download the .p8 file** (if you haven't already)
   - ⚠️ **WARNING:** You can only download this ONCE!
   - Save it securely (you'll need it every 6 months for rotation)

2. **Generate the Secret Key using Supabase Tool:**
   - Go to: https://supabase.com/docs/guides/auth/social-login/auth-apple
   - Scroll to the **secret generation tool** (use Chrome/Firefox, NOT Safari)
   - Fill in:
     - **.p8 file:** Upload or paste entire contents (including `-----BEGIN PRIVATE KEY-----` and `-----END PRIVATE KEY-----`)
     - **Key ID:** `7X94CKX99M`
     - **Team ID:** `783NB5H5V4`
     - **Services ID:** `783NB5H5V4.com.playpadelpals.padelpals362`
   - Click **Generate**
   - **Copy the generated JWT secret** (starts with `eyJ...`)

### Step 4: Update Supabase Configuration

1. **Go to Supabase Dashboard → Authentication → Providers → Apple**

2. **Update ALL fields:**

   - **Secret Key (for OAuth):** Paste the generated JWT (starts with `eyJ...`)
   
   - **Services ID / Client ID:** `783NB5H5V4.com.playpadelpals.padelpals362`
   
   - **Key ID:** `7X94CKX99M` (NEW - replacing old `LUDQJXUZU4`)
   
   - **Team ID:** `783NB5H5V4`

3. **⚠️ CRITICAL: Check "Client IDs" field:**
   - This field should **ONLY** contain: `783NB5H5V4.com.playpadelpals.padelpals362`
   - ❌ **REMOVE** any iOS bundle IDs like:
     - `com.playpadelpals.padelpals362.signin`
     - `com.playpadelpals.padelpals362`
   - ✅ **ONLY** include the Services ID

4. **Enable Apple:** Toggle should be **ON**

5. **Click "Save"**

### Step 5: Wait for Propagation

- ⏰ **Wait 10-15 minutes** for changes to propagate
- Changes in both Apple Developer Portal and Supabase need time to sync

---

## 🔍 About "Grouped App IDs"

The "Grouped App IDs" you see in the key configuration are **normal and expected**. They show:
- **Padel Pals Web Login:** `783NB5H5V4.com.padelpals.app`
- **PadelPals Sign In Service:** `783NB5H5V4.com.playpadelpals.padelpals362.signin`

These are **App IDs** that are grouped with your **Services ID**. This is fine - what matters is:

1. ✅ The **Services ID** (`783NB5H5V4.com.playpadelpals.padelpals362`) is the one configured in Supabase
2. ✅ The **Services ID** has the correct Return URLs and Domains configured
3. ✅ The **Key** (`7X94CKX99M`) is linked to this Services ID

---

## ✅ Final Verification

Before testing, verify all of these match **EXACTLY**:

### In Apple Developer Portal:
- [ ] Services ID: `783NB5H5V4.com.playpadelpals.padelpals362` exists
- [ ] Services ID Return URL: `https://peaphqbxdmknxzsfdxuh.supabase.co/auth/v1/callback`
- [ ] Services ID Domain: `supabase.co`
- [ ] Key `7X94CKX99M` exists and is enabled
- [ ] Key has "Sign in with Apple" enabled

### In Supabase Dashboard:
- [ ] Secret Key: Generated JWT (starts with `eyJ...`) from Supabase tool
- [ ] Services ID / Client ID: `783NB5H5V4.com.playpadelpals.padelpals362`
- [ ] Key ID: `7X94CKX99M` (NOT the old `LUDQJXUZU4`)
- [ ] Team ID: `783NB5H5V4`
- [ ] Client IDs field: **ONLY** `783NB5H5V4.com.playpadelpals.padelpals362` (no iOS bundle IDs)
- [ ] Apple provider: **Enabled** (toggle ON)

---

## 🧪 Test After Configuration

1. **Wait 10-15 minutes** after saving changes

2. **Clear browser storage:**
   ```javascript
   localStorage.clear();
   sessionStorage.clear();
   ```

3. **Test authentication:**
   - Go to: https://www.padelpals.app/auth.html
   - Click "Sign in with Apple"
   - Complete the authorization flow

4. **If it fails:**
   - Visit: https://www.padelpals.app/oauth-diagnostic.html
   - Click "Run Full Diagnostic"
   - Check for specific error messages
   - Check Supabase Auth Logs: Dashboard → Logs → Auth Logs

---

## 🚨 Common Issues After Creating New Key

### Issue: Still seeing old Key ID in Supabase
**Fix:** Make sure you updated the **Key ID** field in Supabase from `LUDQJXUZU4` to `7X94CKX99M`

### Issue: Secret Key format is wrong
**Fix:** Use the Supabase tool to generate the JWT secret. Don't paste the raw .p8 file contents directly if Supabase expects a generated JWT.

### Issue: "invalid_client" error persists
**Fix:** 
1. Verify all three (Secret Key, Key ID, Team ID) match the new key
2. Ensure Services ID Return URL is configured correctly
3. Wait 10-15 minutes for propagation
4. Clear browser storage and try again

---

## 📝 Important Notes

1. **Key Rotation:** Apple requires rotating the secret key every 6 months. Set a reminder to:
   - Generate a new secret key using the same `.p8` file (if key hasn't expired)
   - Or create a new key and .p8 file if the old one expired
   - Update Supabase with the new generated secret

2. **Old Key:** The previous key (`LUDQJXUZU4`) should be disabled/revoked in Apple Developer Portal if you're no longer using it (for security best practices).

3. **Backup:** Keep the `.p8` file safe - you'll need it for future key rotations!

---

**Last Updated:** Based on new key `7X94CKX99M` configuration

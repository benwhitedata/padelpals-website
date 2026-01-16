# Authentication Troubleshooting Guide

## Quick Diagnosis Tool

Visit **https://www.padelpals.app/auth-debug.html** to run automated tests.

This page will check:
- Configuration loading
- Supabase client initialization
- Session status
- Browser storage
- Network connectivity
- OAuth configuration

## Common Issues & Solutions

### 1. **Sign In Button Not Working**

**Symptoms:**
- Click Sign In with Google/Apple, nothing happens
- Button stays disabled
- No error message

**Debug Steps:**
```javascript
// Open browser console (F12) and run:
console.log('Config:', window.config);
console.log('Supabase:', window.supabase);
console.log('Client:', window.supabaseClient);
```

**Solutions:**
- Clear browser cache (Ctrl+Shift+Del)
- Check Network tab for failed requests
- Verify Supabase URL and API key in config

---

### 2. **Redirect Loop (Dashboard → Auth → Dashboard)**

**Symptoms:**
- Page keeps redirecting between auth.html and dashboard.html
- Never stays on one page

**Debug Steps:**
```javascript
// Check localStorage:
localStorage.getItem('authRedirectTime')

// Check session:
window.supabaseClient?.auth.getSession().then(d => console.log(d))
```

**Solutions:**
- Clear localStorage: `localStorage.clear()`
- Sign out completely: Visit auth-debug.html → Clear Storage
- Check if session is expired

---

### 3. **"Multiple GoTrueClient instances" Warning**

**Symptoms:**
- Warning in console about multiple client instances
- Session seems unstable

**Cause:**
- Multiple Supabase clients being created instead of reusing shared instance

**Solution:**
- Ensure all code uses: `window.getOrCreateSupabaseClient()`
- Check browser console for where clients are being created

---

### 4. **OAuth Redirect Not Working**

**Symptoms:**
- After clicking Sign In with Google/Apple, redirected to OAuth provider
- After successful login, lands on blank page or error page

**Debug Steps:**
1. Check the callback URL in Supabase Dashboard:
   - Go to Supabase Dashboard → Authentication → URL Configuration
   - Ensure `https://www.padelpals.app/auth-callback.html` is listed

2. Check browser console on auth-callback.html:
   - Look for errors in the console
   - Check if hash fragment contains access_token

**Solutions:**
- Verify Supabase OAuth configuration
- Check auth-callback.html loads correctly
- Ensure auth-callback.html can access window.config

---

### 5. **Session Expires Immediately**

**Symptoms:**
- Can sign in but immediately logged out
- Session doesn't persist

**Debug Steps:**
```javascript
// Check session expiry:
window.supabaseClient.auth.getSession().then(({data}) => {
  if (data.session) {
    const now = Math.floor(Date.now() / 1000);
    const expiresAt = data.session.expires_at;
    console.log('Expires:', new Date(expiresAt * 1000));
    console.log('Valid for:', (expiresAt - now), 'seconds');
  }
})
```

**Solutions:**
- Check system clock is correct
- Verify Supabase project is active
- Check browser isn't blocking cookies

---

## Manual Diagnostic Steps

### Step 1: Check Configuration

```javascript
// Open console and run:
console.log('Config URL:', window.config?.supabaseUrl);
console.log('Config Key:', window.config?.supabaseKey?.substring(0, 20) + '...');
```

Expected: Both should be defined and non-empty.

### Step 2: Check Supabase Client

```javascript
// Check client exists:
console.log('Shared client:', window.supabaseClient);
console.log('Has auth:', window.supabaseClient?.auth);
```

Expected: Both should be truthy.

### Step 3: Check Session

```javascript
// Get current session:
window.supabaseClient.auth.getSession().then(({data, error}) => {
  console.log('Session:', data.session);
  console.log('Error:', error);
});
```

Expected: Either session data or null (not logged in).

### Step 4: Check Storage

```javascript
// List auth storage keys:
Object.keys(localStorage).filter(k => k.includes('auth')).forEach(k => {
  console.log(k, ':', localStorage.getItem(k).substring(0, 100) + '...');
});
```

Expected: Should see auth-token key with session data.

### Step 5: Test Network

```javascript
// Ping Supabase:
fetch(window.config.supabaseUrl + '/rest/v1/', {
  method: 'HEAD',
  headers: { 'apikey': window.config.supabaseKey }
}).then(r => console.log('Status:', r.status));
```

Expected: Status 200 or 404 (both mean connection works).

---

## Browser Developer Tools

### Chrome/Edge
1. Press `F12` to open DevTools
2. **Console** tab: View errors and run commands
3. **Network** tab: Check if auth requests succeed
4. **Application** tab → Local Storage: View stored session

### Safari
1. Develop menu → Show Web Inspector
2. Enable Develop menu: Preferences → Advanced → Show Develop

---

## Authentication Flow Diagram

```
1. User clicks "Sign In with Google"
   ↓
2. auth.html calls supabase.auth.signInWithOAuth()
   ↓
3. Redirected to Google OAuth
   ↓
4. User authorizes
   ↓
5. Google redirects to auth-callback.html#access_token=...
   ↓
6. auth-callback.html:
   - Parses tokens from URL hash
   - Calls supabase.auth.setSession()
   - Redirects to dashboard.html
   ↓
7. dashboard.html:
   - Checks session exists
   - If yes: loads user data
   - If no: redirects to auth.html
```

---

## Supabase Dashboard Checks

### Required OAuth Settings

1. Go to: https://supabase.com/dashboard/project/YOUR_PROJECT/auth/url-configuration

2. **Site URL:** `https://www.padelpals.app`

3. **Redirect URLs:** Add these:
   ```
   https://www.padelpals.app/auth-callback.html
   https://www.padelpals.app/index.html
   https://www.padelpals.app/dashboard.html
   ```

4. **Providers:** Enable Google and Apple OAuth
   - Each needs Client ID and Secret configured

---

## Still Having Issues?

### Collect Diagnostic Information

Run this in the browser console and share output:

```javascript
const diagnostics = {
  timestamp: new Date().toISOString(),
  config: {
    hasConfig: !!window.config,
    url: window.config?.supabaseUrl,
    keyPrefix: window.config?.supabaseKey?.substring(0, 20)
  },
  client: {
    hasLibrary: !!window.supabase,
    hasSharedClient: !!window.supabaseClient,
    hasAuth: !!window.supabaseClient?.auth
  },
  storage: Object.keys(localStorage).filter(k => k.includes('auth')),
  url: window.location.href,
  userAgent: navigator.userAgent
};

console.log(JSON.stringify(diagnostics, null, 2));
```

### Clear Everything and Start Fresh

```javascript
// Run in console:
await window.supabaseClient?.auth.signOut();
localStorage.clear();
sessionStorage.clear();
location.reload();
```

Then try signing in again.

---

## Contact Information

If you've tried all the above and still have issues:

1. Check the [GitHub Issues](https://github.com/benwhitedata/padelpals-website/issues)
2. Create a new issue with diagnostic information
3. Include browser console errors and network tab screenshots

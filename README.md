# Padel Pals Website

This repository contains the website for Padel Pals, including authentication with Supabase.

## Authentication Setup

### Local Development

1. Create a `config.js` file in the root directory with your Supabase credentials:
```javascript
const config = {
    supabaseUrl: 'YOUR_SUPABASE_URL',
    supabaseKey: 'YOUR_SUPABASE_ANON_KEY'
};
```

2. Run a local server to test the site.

### Netlify Deployment

1. Deploy this site to Netlify.

2. Set up the following environment variables in the Netlify dashboard:
   - `SUPABASE_URL`: Your Supabase project URL
   - `SUPABASE_KEY`: Your Supabase public anon key

3. Configure Supabase Authentication:
   - Go to your Supabase project dashboard
   - Navigate to Authentication > URL Configuration
   - Set site URL to your Netlify domain (e.g., `https://your-site.netlify.app`)
   - Add redirect URL: `https://your-site.netlify.app/auth-callback.html`

4. Configure Apple Sign-In:
   - Create an Apple Developer account if you don't have one
   - Set up a new App ID with Sign in with Apple capability
   - Create a Services ID for your website
   - Configure domains and redirect URLs in your Apple Developer account
   - Add the Apple provider in Supabase Authentication settings
   - Add the required credentials (Client ID, Private Key, etc.)

## Troubleshooting

If authentication is not working:

1. Check browser console for errors
2. Verify Netlify environment variables are set correctly
3. Confirm Supabase redirect URLs are configured properly
4. Ensure Apple Sign-In is properly set up in your Supabase project

## Pages

- **Home**: Landing page with app information
- **Auth**: Sign in with Apple 
- **Dashboard**: User dashboard after authentication
- **Support**: Support information
- **Privacy Policy**: Privacy policy information
- **Box League**: Box league rules
- **App Guide**: Guide for using the app

## Project Structure

- `index.html` - Homepage
- `auth.html` - Authentication page with Apple Sign-In
- `auth-callback.html` - Handles the OAuth callback from Apple
- `dashboard.html` - User dashboard (requires authentication)
- `config.js` - Local configuration file (not in git)
- `.github/workflows/deploy.yml` - GitHub Actions workflow for secure deployment
- `.gitignore` - Excludes sensitive files from git

## Security Notes

- Never commit your `config.js` file with actual credentials
- For production deployments, use GitHub secrets and Actions
- Always use the public anon key from Supabase, never the service role key

## Supabase Configuration

### Configuration Files

The website uses the following configuration files to manage Supabase API access:

1. **config.js** - Basic configuration file created by GitHub Actions during deployment
2. **enhanced-config.js** - Enhanced configuration with built-in fallback mechanism
3. **config-loader.js** - Utility script that attempts to load configuration from multiple sources
4. **supabase-config.js** - Legacy utility for consistent configuration across pages

### Implementation Options

There are several ways to implement Supabase connectivity in your pages:

#### Option 1: Use config-loader.js (Recommended)

```html
<!-- Include config loader -->
<script src="config-loader.js"></script>

<!-- Use configuration after it's loaded -->
<script>
  document.addEventListener('configLoaded', () => {
    // Create Supabase client with loaded configuration
    const supabase = window.supabase.createClient(
      window.config.supabaseUrl,
      window.config.supabaseKey
    );
    
    // Use supabase client here...
  });
</script>
```

#### Option 2: Direct Embedding (For Testing)

```html
<script>
  // Direct hardcoded configuration
  window.config = {
    supabaseUrl: 'https://peaphqbxdmknxzsfdxuh.supabase.co',
    supabaseKey: 'your-api-key-here'
  };
</script>
```

### GitHub Secrets Setup

The website is configured to use GitHub Secrets for secure API key handling:

1. Two secrets are configured in the GitHub repository:
   - `SUPABASE_URL` - The URL of your Supabase project
   - `SUPABASE_ANON_KEY` - The anonymous API key for client-side access

2. GitHub Actions injects these secrets into configuration files during deployment.

3. Fallback mechanisms ensure the site works even if GitHub Secrets injection fails.

### Test Pages

Several test pages demonstrate different configuration approaches:

- **improved-api-test.html** - Uses the new config-loader.js approach (recommended)
- **fixed-api-test.html** - Uses direct embedding for reliable testing
- **inline-api-test.html** - Legacy approach with inline fallback
- **simple-direct-test.html** - Simplified direct embedding approach
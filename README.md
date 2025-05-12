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
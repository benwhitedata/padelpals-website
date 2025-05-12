# Padel Pals Website

This is the official website for the Padel Pals application.

## Authentication Setup

The authentication for this site uses Supabase and is configured to work with GitHub Pages through Netlify Functions. Follow these steps to set up the authentication:

### Setting Up with Netlify

1. Create a Netlify account and connect your GitHub repository.

2. In the Netlify dashboard, go to Site settings > Environment variables.

3. Add the following environment variables:
   - `SUPABASE_URL`: Your Supabase project URL 
   - `SUPABASE_KEY`: Your Supabase public (anon) API key

4. Deploy your site with Netlify to make the functions available.

### Setting Up GitHub Actions for Netlify Deployment

1. In your GitHub repository, go to Settings > Secrets and variables > Actions.

2. Add the following repository secrets:
   - `NETLIFY_AUTH_TOKEN`: Your Netlify authentication token (can be generated in Netlify user settings)
   - `NETLIFY_SITE_ID`: Your Netlify site ID (found in site settings)
   - `SUPABASE_URL`: Your Supabase project URL
   - `SUPABASE_ANON_KEY`: Your Supabase public (anon) API key

3. Push to the main branch, and GitHub Actions will automatically deploy your site to Netlify with the proper environment variables.

### Local Development

For local development, create a `config.js` file in the root directory with the following content:

```javascript
const config = {
  supabaseUrl: 'YOUR_SUPABASE_URL',
  supabaseKey: 'YOUR_SUPABASE_ANON_KEY'
};
```

The site will automatically detect this file and use it for local development.

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
# Padel Pals Website

This repository contains the Padel Pals website with Apple authentication integration using Supabase.

## Setup Instructions

### 1. Supabase Configuration

To run this website locally with authentication:

1. Create a Supabase account at [supabase.com](https://supabase.com)
2. Set up a new project
3. Enable Apple authentication in Authentication > Providers > Apple
4. Add your Apple Developer credentials
5. Create a `config.js` file in the root directory with your Supabase credentials:

```javascript
// config.js
const config = {
    supabaseUrl: 'YOUR_SUPABASE_PROJECT_URL',
    supabaseKey: 'YOUR_SUPABASE_ANON_KEY'
};
```

**Note:** `config.js` is not tracked in git for security reasons. Always keep your API keys private.

### 2. Local Development

To run the website locally:

```bash
# Using Python
python -m http.server

# Or using Node.js with a package like serve
npx serve
```

### 3. Deployment to GitHub Pages

When deploying to GitHub Pages, you'll need to handle the sensitive credentials. 

#### Method 1: GitHub Secrets & Action (Recommended)

1. In the GitHub repository settings, add your Supabase credentials as secrets:
   - `SUPABASE_URL`
   - `SUPABASE_ANON_KEY`

2. Create a GitHub Action workflow that replaces the placeholders in the HTML files with actual values during build:

```yaml
name: Deploy to GitHub Pages

on:
  push:
    branches:
      - main

jobs:
  build-and-deploy:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v2

      - name: Replace Supabase credentials
        run: |
          find . -name "*.html" -type f -exec sed -i "s|REPLACE_WITH_PRODUCTION_URL|${{ secrets.SUPABASE_URL }}|g" {} \;
          find . -name "*.html" -type f -exec sed -i "s|REPLACE_WITH_PRODUCTION_KEY|${{ secrets.SUPABASE_ANON_KEY }}|g" {} \;

      - name: Deploy
        uses: JamesIves/github-pages-deploy-action@4.1.4
        with:
          branch: gh-pages
          folder: .
```

#### Method 2: Manual Deploy with Environment-Specific Builds

1. For local development, use the `config.js` file
2. For production, create a build script that replaces placeholders with actual values
3. Deploy the production build to GitHub Pages

## Apple Authentication Setup

To set up Apple authentication:

1. Create an App ID in the Apple Developer portal
2. Configure Sign in with Apple for your App ID
3. Create a Services ID for your website
4. Configure the Sign in with Apple settings for your Services ID:
   - Add your website domain to the domains list
   - Add the redirect URL (e.g., `https://your-domain.com/auth-callback.html`)
5. Generate a private key for Sign in with Apple
6. Configure Supabase with your Apple credentials:
   - Team ID
   - Services ID
   - Key ID
   - Private Key

## Project Structure

- `index.html` - Homepage
- `auth.html` - Authentication page with Apple Sign-In
- `auth-callback.html` - Handles the OAuth callback from Apple
- `dashboard.html` - User dashboard (requires authentication)
- `config.template.js` - Template for Supabase configuration
- `config.js` - Actual configuration file (not in git)
- `.gitignore` - Excludes sensitive files from git

## Security Notes

- Never commit your `config.js` file with actual credentials
- For production deployments, use environment variables or secrets management
- Always use the public anon key from Supabase, never the service role key
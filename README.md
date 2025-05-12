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

#### Using GitHub Secrets & Actions

This repository is configured to use GitHub Actions for secure deployment. To set it up:

1. Enable GitHub Pages for your repository:
   - Go to your repository's Settings tab
   - Scroll to the "Pages" section
   - Under "Build and deployment", select "GitHub Actions" as the source

2. Add your Supabase credentials as repository secrets:
   - Go to your repository's Settings tab
   - Select "Secrets and variables" → "Actions"
   - Add the following secrets:
     - `SUPABASE_URL` - Your Supabase project URL
     - `SUPABASE_ANON_KEY` - Your Supabase anonymous/public key (NOT the service role key)

3. Push to your main branch, and the GitHub Action will automatically:
   - Replace the placeholder values in your HTML files with the actual secrets
   - Deploy the website to GitHub Pages with the credentials securely injected

The workflow file is located in `.github/workflows/deploy.yml`

#### Manual Alternative (Not recommended)

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
- `config.js` - Local configuration file (not in git)
- `.github/workflows/deploy.yml` - GitHub Actions workflow for secure deployment
- `.gitignore` - Excludes sensitive files from git

## Security Notes

- Never commit your `config.js` file with actual credentials
- For production deployments, use GitHub secrets and Actions
- Always use the public anon key from Supabase, never the service role key
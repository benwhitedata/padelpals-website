# GitHub Pages Configuration Instructions

## Fix GitHub Pages Configuration

1. Go to your GitHub repository: https://github.com/benwhitedata/padelpals-website
2. Click on "Settings" tab
3. In the left sidebar, click on "Pages" under "Code and automation"
4. Verify these settings:
   - **Source**: Deploy from a branch
   - **Branch**: gh-pages (created by your GitHub Actions workflow)
   - **Folder**: / (root)
   - **Custom domain**: www.padelpals.app
   - **Enforce HTTPS**: Should be checked

5. If any of these settings are incorrect, update them and click "Save"
6. Check the "Custom domain" verification status - it should show as "Verified"

## Fix DNS Configuration

1. Go to your domain registrar's DNS settings for padelpals.app
2. Ensure you have these records:

```
Type    Name          Value                           TTL
-----------------------------------------------------------------
CNAME   www           benwhitedata.github.io          Auto/3600
A       @             185.199.108.153                 Auto/3600
A       @             185.199.109.153                 Auto/3600
A       @             185.199.110.153                 Auto/3600
A       @             185.199.111.153                 Auto/3600
```

3. Remove any records pointing to Netlify or other services
4. DNS changes may take up to 24 hours to propagate

## Trigger a fresh deployment

1. Go to "Actions" tab in your repository
2. Select "Deploy to GitHub Pages" workflow
3. Click "Run workflow" on the main branch
4. After workflow completes, check your site again

## Diagnostic Steps

1. Visit https://www.padelpals.app/config-inspector.html
2. Run all tests to diagnose the exact issue
3. Check GitHub workflow logs for any errors

## Troubleshooting Common Issues

1. **Jekyll Processing**: GitHub Pages uses Jekyll by default, which can interfere with certain files. The .nojekyll file should prevent this.

2. **Caching Issues**: Browsers and CDNs may cache old versions. Try opening in an incognito window or clearing your cache.

3. **Branch Conflicts**: Make sure your GitHub Actions workflow is deploying to the correct branch, and that branch is set as the source for GitHub Pages.

4. **Secret Injection**: Verify in the GitHub Actions logs that the config.js file is being created correctly with the secrets injected.

5. **Deployment Path**: If using a custom action for deployment, ensure it's deploying to the root of the gh-pages branch.

## Manual Fix if Needed

If all else fails, you can temporarily hardcode the values for testing:

```js
// Add this to your HTML files directly for testing
<script>
const config = {
  supabaseUrl: 'https://peaphqbxdmknxzsfdxuh.supabase.co',
  supabaseKey: 'your-anon-key-here' // Replace with your actual key
};
</script>
```

**Important**: Remove this after fixing the proper deployment method! 
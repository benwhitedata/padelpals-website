// Script to verify config.js was created correctly during GitHub Actions
const fs = require('fs');

console.log('Starting verification of config.js');

// Check if config.js exists
if (fs.existsSync('config.js')) {
    console.log('✅ config.js file exists');
    
    // Read the file content
    const configContent = fs.readFileSync('config.js', 'utf8');
    console.log(`File size: ${configContent.length} bytes`);
    
    // Check if it contains key patterns without revealing the keys
    const hasSupabaseUrl = configContent.includes('supabaseUrl');
    const hasSupabaseKey = configContent.includes('supabaseKey');
    
    console.log(`Contains supabaseUrl: ${hasSupabaseUrl ? '✅ Yes' : '❌ No'}`);
    console.log(`Contains supabaseKey: ${hasSupabaseKey ? '✅ Yes' : '❌ No'}`);
    
    // Check if the URL and key are placeholders or actual values
    const urlPlaceholder = configContent.includes("'${{ secrets.SUPABASE_URL }}'");
    const keyPlaceholder = configContent.includes("'${{ secrets.SUPABASE_ANON_KEY }}'");
    
    if (urlPlaceholder || keyPlaceholder) {
        console.log('❌ Error: GitHub Secret placeholders found in the file - secrets were not injected properly');
    } else {
        console.log('✅ Placeholders were correctly replaced with actual values');
    }
    
    // Create a simple test file
    fs.writeFileSync('config-verification.txt', `
    Config.js verification performed: ${new Date().toISOString()}
    File exists: Yes
    File size: ${configContent.length} bytes
    Contains supabaseUrl: ${hasSupabaseUrl ? 'Yes' : 'No'}
    Contains supabaseKey: ${hasSupabaseKey ? 'Yes' : 'No'}
    Placeholders replaced: ${(!urlPlaceholder && !keyPlaceholder) ? 'Yes' : 'No'}
    `);
    
    console.log('✅ Verification complete - see config-verification.txt');
} else {
    console.log('❌ Error: config.js file does not exist');
    fs.writeFileSync('config-verification.txt', `
    Config.js verification performed: ${new Date().toISOString()}
    File exists: No
    `);
} 
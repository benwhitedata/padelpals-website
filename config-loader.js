// Config Loader Utility
// This script attempts to load configuration in multiple ways:
// 1. From window.config if it already exists
// 2. From enhanced-config.js (deployed by GitHub Actions with fallback)
// 3. From config.js (original approach)
// 4. Using a hardcoded fallback configuration as last resort

// Define fallback configuration for local development
const fallbackConfig = {
    supabaseUrl: 'https://peaphqbxdmknxzsfdxuh.supabase.co',
    supabaseKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBlYXBocWJ4ZG1rbnh6c2ZkeHVoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDEwMTA5NzcsImV4cCI6MjA1NjU4Njk3N30.RYBFcTJC13TOajpWSCybcq-IExXNaEvfSPRkwG16Bt8'
};

// Function to load external config file
function loadConfigFile(url) {
    return new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = url + '?v=' + new Date().getTime(); // Cache busting
        script.onload = () => {
            if (window.config && window.config.supabaseKey) {
                console.log('Config loaded from ' + url);
                resolve(window.config);
            } else {
                reject(new Error('Config loaded but no valid key found'));
            }
        };
        script.onerror = () => reject(new Error('Failed to load ' + url));
        document.head.appendChild(script);
    });
}

// Initialize configuration asynchronously
async function initConfig() {
    // If config is already defined, use it
    if (window.config && window.config.supabaseKey) {
        console.log('Using pre-existing config');
        return window.config;
    }
    
    // Try loading enhanced config first
    try {
        await loadConfigFile('enhanced-config.js');
        return window.config;
    } catch (error) {
        console.log('Enhanced config not found, trying original config.js');
    }
    
    // Try loading original config
    try {
        await loadConfigFile('config.js');
        return window.config;
    } catch (error) {
        console.log('No config files found, using fallback');
    }
    
    // Use fallback as last resort
    console.warn('Using fallback configuration');
    window.config = fallbackConfig;
    return window.config;
}

// Shared Supabase client instance - reused across all pages
function getOrCreateSupabaseClient() {
    // Return existing client if already created
    if (window.supabaseClient && window.supabaseClient.auth) {
        return window.supabaseClient;
    }
    
    // Create new client only if Supabase library is loaded and config is available
    if (window.supabase && window.config && window.config.supabaseUrl && window.config.supabaseKey) {
        try {
            window.supabaseClient = window.supabase.createClient(
                window.config.supabaseUrl,
                window.config.supabaseKey,
                {
                    auth: {
                        storageKey: 'sb-peaphqbxdmknxzsfdxuh-auth-token', // Consistent storage key
                        autoRefreshToken: true,
                        persistSession: true,
                        detectSessionInUrl: true
                    }
                }
            );
            console.log('Shared Supabase client initialized');
            return window.supabaseClient;
        } catch (error) {
            console.error('Error creating shared Supabase client:', error);
            return null;
        }
    }
    
    return null;
}

// Log config source and status when available
initConfig().then(config => {
    console.log('Configuration initialized');
    console.log('Supabase URL:', config.supabaseUrl);
    console.log('API Key available:', config.supabaseKey ? 'Yes' : 'No');
    
    // Initialize shared Supabase client after config is loaded
    if (window.supabase) {
        getOrCreateSupabaseClient();
    } else {
        // If Supabase library isn't loaded yet, wait for it
        const checkSupabase = setInterval(() => {
            if (window.supabase) {
                clearInterval(checkSupabase);
                getOrCreateSupabaseClient();
            }
        }, 100);
        
        // Stop checking after 5 seconds
        setTimeout(() => clearInterval(checkSupabase), 5000);
    }
    
    // Signal that configuration is ready
    const event = new Event('configLoaded');
    document.dispatchEvent(event);
}).catch(error => {
    console.error('Configuration initialization failed:', error);
    // Use fallback on any error
    window.config = fallbackConfig;
    console.warn('Falling back to embedded configuration');
    
    // Try to initialize client with fallback config
    if (window.supabase) {
        getOrCreateSupabaseClient();
    }
    
    // Signal that configuration is ready (with fallback)
    const event = new Event('configLoaded');
    document.dispatchEvent(event);
});

// Export the function globally so other scripts can use it
window.getOrCreateSupabaseClient = getOrCreateSupabaseClient; 
// Supabase Configuration Utility
// Include this script in any page that needs to access Supabase

// Define fallback configuration with embedded key
const fallbackConfig = {
    supabaseUrl: 'https://peaphqbxdmknxzsfdxuh.supabase.co',
    supabaseKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBlYXBocWJ4ZG1rbnh6c2ZkeHVoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDEwMTA5NzcsImV4cCI6MjA1NjU4Njk3N30.RYBFcTJC13TOajpWSCybcq-IExXNaEvfSPRkwG16Bt8'
};

// Create or use global config variable
if (typeof window.config === 'undefined') {
    window.config = fallbackConfig;
    console.log('Using fallback Supabase configuration');
}

// Initialize Supabase client (if supabase is available)
function initSupabase() {
    if (typeof window.supabase !== 'undefined') {
        try {
            const supabaseClient = window.supabase.createClient(
                window.config.supabaseUrl,
                window.config.supabaseKey
            );
            console.log('Supabase client initialized successfully');
            return supabaseClient;
        } catch (error) {
            console.error('Error initializing Supabase client:', error);
            return null;
        }
    } else {
        console.error('Supabase library not loaded');
        return null;
    }
}

// Utility to get Supabase client (creates if needed)
function getSupabaseClient() {
    if (!window._supabaseClient) {
        window._supabaseClient = initSupabase();
    }
    return window._supabaseClient;
}

// Log configuration status (non-sensitive parts)
console.log(`Supabase URL: ${window.config.supabaseUrl}`);
console.log(`API Key available: ${window.config.supabaseKey ? 'Yes' : 'No'}`); 
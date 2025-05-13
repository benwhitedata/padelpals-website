// Enhanced configuration file with fallback
// Created by GitHub Actions at Tue May 13 16:46:32 UTC 2025

const config = {
    supabaseUrl: 'https://peaphqbxdmknxzsfdxuh.supabase.co',
    supabaseKey: ' 
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBlYXBocWJ4ZG1rbnh6c2ZkeHVoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDEwMTA5NzcsImV4cCI6MjA1NjU4Njk3N30.RYBFcTJC13TOajpWSCybcq-IExXNaEvfSPRkwG16Bt8'
};

// Provide fallback for local development if key is missing
if (!config.supabaseKey || config.supabaseKey === '') {
    console.warn('Using fallback API key - GitHub secret was not injected');
    config.supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBlYXBocWJ4ZG1rbnh6c2ZkeHVoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDEwMTA5NzcsImV4cCI6MjA1NjU4Njk3N30.RYBFcTJC13TOajpWSCybcq-IExXNaEvfSPRkwG16Bt8';
}

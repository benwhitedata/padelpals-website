// Netlify serverless function to securely provide environment variables
exports.handler = async function(event, context) {
  // Enable CORS for the function
  const headers = {
    'Access-Control-Allow-Origin': '*', // In production, restrict this to your domain
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json'
  };

  // Check if required environment variables are set
  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_KEY) {
    console.error("Missing required environment variables");
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error: "Server configuration error - missing environment variables"
      })
    };
  }

  // Return Supabase credentials from environment variables
  return {
    statusCode: 200,
    headers,
    body: JSON.stringify({
      SUPABASE_URL: process.env.SUPABASE_URL,
      SUPABASE_KEY: process.env.SUPABASE_KEY
    })
  };
}; 
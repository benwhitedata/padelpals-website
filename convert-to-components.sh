#!/bin/bash

# Function to convert a page to use components
convert_page() {
    local page=$1
    echo "Converting $page to use components..."
    
    # Backup the original file
    cp "$page" "${page}.bak"
    
    # Add components.js script to head
    sed -i '' 's|<!-- End Google Analytics -->|<!-- End Google Analytics -->\n    \n    <!-- Components loader -->\n    <script src="js/components.js"></script>|g' "$page"
    
    # Replace navbar with container div
    sed -i '' '/<nav class="navbar/,/<\/nav>/c\
    <!-- Navigation container - will be filled by JavaScript -->\
    <div id="navbar-container"></div>' "$page"
    
    # Replace footer with container div
    sed -i '' '/<footer class="footer/,/<\/footer>/c\
    <!-- Footer container - will be filled by JavaScript -->\
    <div id="footer-container"></div>' "$page"
    
    # Remove authentication script
    sed -i '' '/<script>\s*\/\/ Initialize Supabase client/,/<\/script>/d' "$page"
    
    echo "Successfully converted $page"
}

# Make sure the components directory exists
mkdir -p components js

# Create base files if they don't exist
if [ ! -f "js/components.js" ]; then
    echo "Creating js/components.js..."
    cat > js/components.js << 'EOF'
// Function to load a component into a specific element
async function loadComponent(elementId, componentPath) {
    try {
        const response = await fetch(componentPath);
        if (!response.ok) {
            throw new Error(`Failed to load component: ${response.status} ${response.statusText}`);
        }
        const html = await response.text();
        document.getElementById(elementId).innerHTML = html;
    } catch (error) {
        console.error(`Error loading component ${componentPath}:`, error);
    }
}

// Function to load a script component
async function loadScriptComponent(componentPath) {
    try {
        const response = await fetch(componentPath);
        if (!response.ok) {
            throw new Error(`Failed to load script component: ${response.status} ${response.statusText}`);
        }
        const scriptContent = await response.text();
        
        // Create a new script element and add it to the page
        const scriptElement = document.createElement('script');
        scriptElement.textContent = scriptContent;
        document.body.appendChild(scriptElement);
    } catch (error) {
        console.error(`Error loading script component ${componentPath}:`, error);
    }
}

// Load all components when the DOM is fully loaded
document.addEventListener('DOMContentLoaded', async function() {
    // Load navbar and footer
    await loadComponent('navbar-container', '/components/navbar.html');
    await loadComponent('footer-container', '/components/footer.html');
    
    // Load auth script component last (after navbar and footer are loaded)
    await loadScriptComponent('/components/auth-script.html');
});
EOF
fi

# List of pages to convert
PAGES=(
    "index.html"
    "support.html"
    "privacy.html"
    "boxleague.html"
    "guide.html"
    "dashboard.html"
    "auth.html"
)

# Convert each page
for page in "${PAGES[@]}"; do
    if [ -f "$page" ]; then
        convert_page "$page"
    else
        echo "Warning: $page not found, skipping"
    fi
done

echo "All pages have been converted to use components."
echo "Remember to test the website thoroughly before committing these changes." 
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
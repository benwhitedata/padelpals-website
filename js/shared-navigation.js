/**
 * Shared Navigation Component for Padel Pals
 * This component provides consistent navigation across all pages
 */

// Shared CSS for navigation (to be included in page head)
const SHARED_NAVIGATION_CSS = `
/* Top Navigation Banner */
.top-nav {
    background: linear-gradient(90deg, #4A90E2 0%, #2a3990 100%);
    padding: 8px 0;
    color: white;
    text-align: center;
    font-size: 0.9rem;
    font-weight: 600;
}

/* Main Navigation */
.main-nav {
    background: #FFFFFF;
    box-shadow: 0 2px 8px rgba(0,0,0,0.1);
    position: sticky;
    top: 0;
    z-index: 100;
}

.nav-container {
    max-width: 1200px;
    margin: 0 auto;
    display: flex;
    align-items: center;
    padding: 0 20px;
}

.logo {
    display: flex;
    align-items: center;
    text-decoration: none;
    margin-right: 40px;
    transition: opacity 0.3s ease;
}

.logo:hover {
    opacity: 0.8;
}

.logo-img {
    height: 40px;
    width: auto;
    margin-right: 12px;
}

.logo-text {
    font-size: 1.6rem;
    font-weight: 700;
    color: #4A90E2;
    font-family: 'Montserrat', sans-serif;
}

.nav-menu {
    display: flex;
    list-style: none;
    align-items: center;
    flex: 1;
}

.nav-item {
    position: relative;
    margin-right: 30px;
}

.nav-link {
    color: rgba(0, 0, 0, 0.87);
    text-decoration: none;
    font-weight: 600;
    padding: 20px 0;
    display: block;
    transition: color 0.3s ease;
}

.nav-link:hover {
    color: #4A90E2;
}

.nav-item.has-dropdown:hover .dropdown {
    opacity: 1;
    visibility: visible;
    transform: translateY(0);
}

.dropdown {
    position: absolute;
    top: 100%;
    left: 0;
    background: #FFFFFF;
    box-shadow: 0 8px 24px rgba(0,0,0,0.15);
    border-radius: 8px;
    padding: 16px 0;
    min-width: 250px;
    opacity: 0;
    visibility: hidden;
    transform: translateY(-10px);
    transition: all 0.3s ease;
    z-index: 1000;
}

.dropdown-section {
    padding: 0 16px;
}

.dropdown-title {
    font-size: 0.9rem;
    font-weight: 700;
    color: #4A90E2;
    margin-bottom: 8px;
    text-transform: uppercase;
    letter-spacing: 0.5px;
}

.dropdown-link {
    color: rgba(0, 0, 0, 0.87);
    text-decoration: none;
    padding: 8px 16px;
    display: block;
    border-radius: 8px;
    transition: background-color 0.2s ease;
    font-size: 0.9rem;
}

.dropdown-link:hover {
    background-color: #E8F4F8;
    color: #4A90E2;
}

.dropdown-separator {
    height: 1px;
    background: #E8F4F8;
    margin: 12px 0;
}

/* Mobile Menu Toggle */
.mobile-toggle {
    display: none;
    background: none;
    border: none;
    font-size: 1.5rem;
    color: #232323;
    cursor: pointer;
    margin-left: auto;
}

/* Authentication UI */
.auth-container {
    display: flex;
    align-items: center;
    gap: 12px;
    margin-left: auto;
}

.user-info {
    display: none;
    color: rgba(0, 0, 0, 0.87);
    font-size: 0.9rem;
    font-weight: 600;
    padding: 8px 16px;
    background: #E8F4F8;
    border-radius: 8px;
}

.auth-button {
    background: #4A90E2;
    color: white;
    border: none;
    padding: 10px 20px;
    border-radius: 6px;
    font-weight: 600;
    font-size: 0.9rem;
    cursor: pointer;
    transition: all 0.3s ease;
    display: none;
}

.auth-button:hover {
    background: #2a3990;
    transform: translateY(-1px);
}

.auth-button.logout {
    background: #dc3545;
}

.auth-button.logout:hover {
    background: #c82333;
}

@media (max-width: 768px) {
    .logo {
        margin-right: 20px;
    }
    
    .logo-img {
        height: 32px;
        margin-right: 8px;
    }
    
    .logo-text {
        font-size: 1.3rem;
    }

    .nav-menu {
        display: none;
        position: absolute;
        top: 100%;
        left: 0;
        right: 0;
        background: #FFFFFF;
        box-shadow: 0 4px 8px rgba(0,0,0,0.1);
        flex-direction: column;
        padding: 20px;
    }

    .nav-menu.mobile-active {
        display: flex;
    }

    .mobile-toggle {
        display: block;
    }

    .nav-item {
        margin: 0;
        width: 100%;
    }

    .nav-link {
        padding: 12px 0;
        border-bottom: 1px solid #E8F4F8;
    }

    .dropdown {
        position: static;
        opacity: 1;
        visibility: visible;
        transform: none;
        box-shadow: none;
        padding: 0;
        margin-left: 20px;
    }
}
`;

// Shared HTML for navigation
const SHARED_NAVIGATION_HTML = `
<!-- Top Navigation Banner -->
<div class="top-nav">
    🎾 Track Your Padel Matches • Manage Tournaments • Improve Your Game
</div>

<!-- Main Navigation -->
<nav class="main-nav">
    <div class="nav-container">
        <a href="index.html" class="logo">
            <img src="images/Icon.png" alt="Padel Pals Logo" class="logo-img">
            <span class="logo-text">Padel Pals</span>
        </a>
        <ul class="nav-menu" id="navMenu">
            <li class="nav-item">
                <a href="index.html" class="nav-link">Home</a>
            </li>
            
            <li class="nav-item">
                <a href="guide.html" class="nav-link">App Guide</a>
            </li>
            
            <li class="nav-item">
                <a href="boxleague.html" class="nav-link">Box League</a>
            </li>
            
            <li class="nav-item">
                <a href="dashboard.html" class="nav-link">Dashboard</a>
            </li>
            
            <li class="nav-item has-dropdown">
                <a href="#" class="nav-link">More</a>
                <div class="dropdown">
                    <div class="dropdown-section">
                        <div class="dropdown-title">Information</div>
                        <a href="support.html" class="dropdown-link">💬 Support</a>
                        <a href="privacy.html" class="dropdown-link">🔒 Privacy Policy</a>
                    </div>
                </div>
            </li>
        </ul>
        
        <!-- Authentication UI -->
        <div class="auth-container">
            <span class="user-info" id="userInfo"></span>
            <a href="dashboard.html" class="auth-button" id="dashboardButton" style="display: none; text-decoration: none;">
                <i class="fas fa-tachometer-alt" style="margin-right: 6px;"></i>Dashboard
            </a>
            <a href="auth.html" class="auth-button" id="loginButton" style="text-decoration: none;">
                <i class="fas fa-sign-in-alt" style="margin-right: 6px;"></i>Sign In
            </a>
        </div>
        
        <button class="mobile-toggle" id="mobileToggle">☰</button>
    </div>
</nav>
`;

// Shared JavaScript for navigation functionality
const SHARED_NAVIGATION_JS = `
// Mobile Navigation Toggle
document.addEventListener('DOMContentLoaded', function() {
    const mobileToggle = document.getElementById('mobileToggle');
    const navMenu = document.getElementById('navMenu');
    
    if (mobileToggle && navMenu) {
        mobileToggle.addEventListener('click', function() {
            navMenu.classList.toggle('mobile-active');
            this.textContent = navMenu.classList.contains('mobile-active') ? '✕' : '☰';
        });
    }
    
    // Set active nav item based on current page
    const currentPage = window.location.pathname.split('/').pop() || 'index.html';
    const navLinks = document.querySelectorAll('.nav-link');
    navLinks.forEach(link => {
        const linkPath = link.getAttribute('href');
        if (linkPath === currentPage || (currentPage === '' && linkPath === 'index.html')) {
            link.style.color = '#4A90E2';
            link.style.fontWeight = '700';
        }
    });
});

// Smooth scrolling for anchor links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            target.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        }
    });
});

// Close navigation when clicking outside on mobile
document.addEventListener('click', function(event) {
    const navMenu = document.getElementById('navMenu');
    const mobileToggle = document.getElementById('mobileToggle');
    
    if (window.innerWidth <= 768 && navMenu && mobileToggle) {
        if (!navMenu.contains(event.target) && !mobileToggle.contains(event.target)) {
            navMenu.classList.remove('mobile-active');
            mobileToggle.textContent = '☰';
        }
    }
});

// Update Auth UI function
function updateAuthUI() {
    const loginButton = document.getElementById('loginButton');
    const dashboardButton = document.getElementById('dashboardButton');
    const userInfo = document.getElementById('userInfo');
    
    // Check if Supabase is available and user is authenticated
    if (window.supabase && window.config) {
        window.supabase.auth.getSession().then(({ data: { session } }) => {
            if (session) {
                if (loginButton) loginButton.style.display = 'none';
                if (dashboardButton) dashboardButton.style.display = 'inline-block';
                if (userInfo) {
                    userInfo.textContent = session.user.email || 'User';
                    userInfo.style.display = 'block';
                }
            } else {
                if (loginButton) loginButton.style.display = 'inline-block';
                if (dashboardButton) dashboardButton.style.display = 'none';
                if (userInfo) userInfo.style.display = 'none';
            }
        }).catch(err => {
            console.log('Auth check error:', err);
            // Show login button if there's an error
            if (loginButton) loginButton.style.display = 'inline-block';
            if (dashboardButton) dashboardButton.style.display = 'none';
            if (userInfo) userInfo.style.display = 'none';
        });
    } else {
        // Config not loaded yet, try again later
        if (window.configLoaderReady) {
            setTimeout(updateAuthUI, 500);
        }
    }
}

// Wait for Supabase to initialize and update auth UI
if (typeof window !== 'undefined') {
    // Wait for config to load first
    document.addEventListener('configLoaded', function() {
        setTimeout(() => {
            updateAuthUI();
            // Listen for auth state changes
            if (window.supabase && window.config) {
                window.supabase.auth.onAuthStateChange((event, session) => {
                    updateAuthUI();
                });
            }
        }, 500);
    });
    
    // Also try after a delay in case configLoaded already fired
    setTimeout(() => {
        updateAuthUI();
        // Listen for auth state changes
        if (window.supabase && window.config) {
            window.supabase.auth.onAuthStateChange((event, session) => {
                updateAuthUI();
            });
        }
    }, 1500);
}
`;

// Shared Footer CSS
const SHARED_FOOTER_CSS = `
.footer {
    background: #1a2238;
    color: white;
    padding: 48px 0 24px;
    margin-top: 60px;
}

.footer-content {
    max-width: 1200px;
    margin: 0 auto;
    padding: 0 20px;
}

.footer-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
    gap: 32px;
    margin-bottom: 32px;
}

.footer-section h4 {
    color: #4A90E2;
    font-size: 1.1rem;
    font-weight: 600;
    margin-bottom: 16px;
}

.footer-section ul {
    list-style: none;
    padding: 0;
}

.footer-section ul li {
    margin-bottom: 8px;
}

.footer-section ul li a {
    color: rgba(255, 255, 255, 0.87);
    text-decoration: none;
    transition: color 0.3s ease;
}

.footer-section ul li a:hover {
    color: #4A90E2;
}

.footer-bottom {
    border-top: 1px solid rgba(255, 255, 255, 0.12);
    padding-top: 24px;
    text-align: center;
    color: rgba(255, 255, 255, 0.6);
}
`;

// Shared Footer HTML
const SHARED_FOOTER_HTML = `
<footer class="footer">
    <div class="footer-content">
        <div class="footer-grid">
            <div class="footer-section">
                <h4>Padel Pals</h4>
                <ul>
                    <li><a href="index.html">Home</a></li>
                    <li><a href="guide.html">App Guide</a></li>
                    <li><a href="boxleague.html">Box League</a></li>
                    <li><a href="dashboard.html">Dashboard</a></li>
                </ul>
            </div>
            
            <div class="footer-section">
                <h4>Information</h4>
                <ul>
                    <li><a href="support.html">Support</a></li>
                    <li><a href="privacy.html">Privacy Policy</a></li>
                    <li><a href="auth.html">Sign In</a></li>
                </ul>
            </div>
            
            <div class="footer-section">
                <h4>Download</h4>
                <ul>
                    <li><a href="https://apps.apple.com/app/padel-pals/id6742356382">App Store</a></li>
                </ul>
            </div>
        </div>
        
        <div class="footer-bottom">
            <p>&copy; 2025 Padel Pals. All rights reserved.</p>
        </div>
    </div>
</footer>
`;

/**
 * Initialize shared navigation on page load
 * This function should be called in each page's script section
 */
function initSharedNavigation() {
    // Add CSS to page
    const style = document.createElement('style');
    style.textContent = SHARED_NAVIGATION_CSS;
    document.head.appendChild(style);
    
    // Add navigation HTML to page (insert after body opening tag)
    const navContainer = document.createElement('div');
    navContainer.innerHTML = SHARED_NAVIGATION_HTML;
    // Insert top-nav first, then main-nav
    const firstChild = navContainer.firstElementChild;
    const secondChild = firstChild ? firstChild.nextElementSibling : null;
    if (firstChild) {
        document.body.insertBefore(firstChild, document.body.firstChild);
    }
    if (secondChild) {
        document.body.insertBefore(secondChild, document.body.firstChild);
    }
    
    // Add JavaScript functionality
    const script = document.createElement('script');
    script.textContent = SHARED_NAVIGATION_JS;
    document.body.appendChild(script);
}

/**
 * Initialize shared footer on page load
 */
function initSharedFooter() {
    // Add Footer CSS to page
    const footerStyle = document.createElement('style');
    footerStyle.textContent = SHARED_FOOTER_CSS;
    document.head.appendChild(footerStyle);
    
    // Add footer HTML to page (insert before body closing tag)
    const footerContainer = document.createElement('div');
    footerContainer.innerHTML = SHARED_FOOTER_HTML;
    document.body.appendChild(footerContainer.firstElementChild);
}

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        SHARED_NAVIGATION_CSS,
        SHARED_NAVIGATION_HTML,
        SHARED_NAVIGATION_JS,
        SHARED_FOOTER_CSS,
        SHARED_FOOTER_HTML,
        initSharedNavigation,
        initSharedFooter
    };
}

// Auto-initialize if script is loaded directly
if (typeof window !== 'undefined' && window.document) {
    // Check if we should auto-initialize (add data-auto-nav="true" to script tag)
    const scriptTag = document.querySelector('script[src*="shared-navigation.js"]');
    if (scriptTag && scriptTag.getAttribute('data-auto-nav') === 'true') {
        document.addEventListener('DOMContentLoaded', function() {
            initSharedNavigation();
            initSharedFooter();
        });
    }
}
/**
 * Shared Navigation Component for Padel Pals
 * This component provides consistent navigation across all pages
 */

// Shared CSS for navigation (to be included in page head)
const SHARED_NAVIGATION_CSS = `
/* Top Navigation Banner - fixed height for consistency across all pages */
.top-nav {
    background: linear-gradient(90deg, #4A90E2 0%, #2a3990 100%);
    height: 40px;
    line-height: 40px;
    padding: 0 16px;
    color: white;
    text-align: center;
    font-size: 0.9rem;
    font-weight: 600;
    white-space: nowrap;
    overflow: hidden;
    box-sizing: border-box;
}
@media (max-width: 768px) {
    .top-nav { font-size: 0.8rem; }
}
@media (max-width: 480px) {
    .top-nav { font-size: 0.7rem; }
}

/* Main Navigation - fixed height for consistency across all pages */
.main-nav {
    background: #FFFFFF;
    box-shadow: 0 2px 8px rgba(0,0,0,0.1);
    position: sticky;
    top: 0;
    z-index: 100;
    height: 64px;
    min-height: 64px;
    box-sizing: border-box;
}

.nav-container {
    max-width: 1200px;
    margin: 0 auto;
    display: flex;
    align-items: center;
    height: 100%;
    min-height: 64px;
    padding: 0 20px;
    box-sizing: border-box;
}

.logo {
    display: flex;
    align-items: center;
    text-decoration: none;
    margin-right: 28px;
    flex-shrink: 0;
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
    margin: 0;
    padding: 0;
    gap: 4px;
}

.nav-item {
    position: relative;
    margin: 0;
}

.nav-link {
    color: rgba(0, 0, 0, 0.87);
    text-decoration: none;
    font-weight: 600;
    padding: 14px 12px;
    display: inline-flex;
    align-items: center;
    gap: 6px;
    transition: color 0.3s ease;
    line-height: 1.3;
    white-space: nowrap;
    border: none;
    background: none;
    font-family: inherit;
    font-size: inherit;
    cursor: pointer;
}

.nav-link:hover,
.nav-link:focus-visible,
.nav-link.is-active {
    color: #4A90E2;
}

.nav-link.is-active {
    font-weight: 700;
}

.nav-chevron {
    width: 0;
    height: 0;
    border-left: 4px solid transparent;
    border-right: 4px solid transparent;
    border-top: 5px solid currentColor;
    opacity: 0.55;
    transition: transform 0.2s ease;
}

.nav-item.has-dropdown.open .nav-chevron,
.nav-item.has-dropdown:hover .nav-chevron {
    transform: rotate(180deg);
}

.nav-item.has-dropdown:hover .dropdown,
.nav-item.has-dropdown.open .dropdown,
.nav-item.has-dropdown:focus-within .dropdown {
    opacity: 1;
    visibility: visible;
    transform: translateY(0);
    pointer-events: auto;
}

.dropdown {
    position: absolute;
    top: 100%;
    left: 0;
    background: #FFFFFF;
    box-shadow: 0 8px 24px rgba(0,0,0,0.15);
    border-radius: 8px;
    padding: 10px 0;
    min-width: 220px;
    opacity: 0;
    visibility: hidden;
    transform: translateY(-8px);
    transition: opacity 0.2s ease, transform 0.2s ease, visibility 0.2s ease;
    z-index: 1000;
    pointer-events: none;
}

.dropdown-link {
    color: rgba(0, 0, 0, 0.87);
    text-decoration: none;
    padding: 10px 18px;
    display: block;
    transition: background-color 0.2s ease, color 0.2s ease;
    font-size: 0.92rem;
    font-weight: 500;
}

.dropdown-link:hover,
.dropdown-link:focus-visible,
.dropdown-link.is-active {
    background-color: #E8F4F8;
    color: #4A90E2;
}

.dropdown-link.is-active {
    font-weight: 700;
}

.dropdown-separator {
    height: 1px;
    background: #E8F4F8;
    margin: 8px 0;
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

@media (max-width: 960px) {
    .nav-link {
        padding: 14px 8px;
        font-size: 0.95rem;
    }
}

@media (max-width: 768px) {
    .logo {
        margin-right: 12px;
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
        box-shadow: 0 8px 20px rgba(0,0,0,0.12);
        flex-direction: column;
        align-items: stretch;
        padding: 12px 16px 20px;
        gap: 0;
        max-height: calc(100vh - 104px);
        overflow-y: auto;
    }

    .nav-menu.mobile-active {
        display: flex;
    }

    .mobile-toggle {
        display: block;
    }

    .nav-item {
        width: 100%;
    }

    .nav-link {
        width: 100%;
        justify-content: space-between;
        padding: 14px 4px;
        border-bottom: 1px solid #E8F4F8;
        font-size: 1rem;
    }

    .nav-item.has-dropdown > .nav-link {
        font-weight: 700;
        color: #2a3990;
    }

    .nav-item.has-dropdown:hover .dropdown,
    .nav-item.has-dropdown:focus-within .dropdown {
        opacity: 0;
        visibility: hidden;
        pointer-events: none;
    }

    .dropdown {
        position: static;
        opacity: 0;
        visibility: hidden;
        transform: none;
        box-shadow: none;
        padding: 0 0 8px;
        margin: 0;
        min-width: 0;
        pointer-events: none;
        max-height: 0;
        overflow: hidden;
        transition: none;
    }

    .nav-item.has-dropdown.open .dropdown {
        opacity: 1;
        visibility: visible;
        pointer-events: auto;
        max-height: 320px;
    }

    .dropdown-link {
        padding: 12px 12px 12px 16px;
        border-bottom: 1px solid #F3F7FA;
    }
}
`;

// Shared HTML for navigation
const SHARED_NAVIGATION_HTML = `
<!-- Top Navigation Banner -->
<div class="top-nav">
    Know your game • Find the right match • Play with your club
</div>

<!-- Main Navigation -->
<nav class="main-nav">
    <div class="nav-container">
        <a href="index.html" class="logo">
            <img src="images/Icon.png" alt="Padel Pals Logo" class="logo-img">
            <span class="logo-text">Padel Pals</span>
        </a>
        <ul class="nav-menu" id="navMenu">
            <!-- Primary: the three product pillars from the site banner -->
            <li class="nav-item">
                <a href="stats.html" class="nav-link">Stats</a>
            </li>
            <li class="nav-item">
                <a href="find-a-match.html" class="nav-link">Find a Match</a>
            </li>
            <li class="nav-item">
                <a href="club-socials.html" class="nav-link">Club Socials</a>
            </li>

            <!-- Secondary product pages -->
            <li class="nav-item has-dropdown">
                <button type="button" class="nav-link" aria-expanded="false" aria-haspopup="true" data-dropdown-trigger>
                    Features <span class="nav-chevron" aria-hidden="true"></span>
                </button>
                <div class="dropdown" role="menu">
                    <a href="ratings.html" class="dropdown-link" role="menuitem">Player Levels</a>
                    <a href="badges.html" class="dropdown-link" role="menuitem">Badges</a>
                    <a href="boxleague.html" class="dropdown-link" role="menuitem">Box League</a>
                </div>
            </li>

            <!-- Help & utility (Privacy / Terms stay in the footer) -->
            <li class="nav-item has-dropdown">
                <button type="button" class="nav-link" aria-expanded="false" aria-haspopup="true" data-dropdown-trigger>
                    Help <span class="nav-chevron" aria-hidden="true"></span>
                </button>
                <div class="dropdown" role="menu">
                    <a href="guide.html" class="dropdown-link" role="menuitem">App Guide</a>
                    <a href="support.html" class="dropdown-link" role="menuitem">Help &amp; Contact</a>
                    <div class="dropdown-separator" role="separator"></div>
                    <a href="tip.html" class="dropdown-link" role="menuitem">Support the app</a>
                </div>
            </li>
        </ul>
        
        <!-- Authentication UI -->
        <div class="auth-container">
            <span class="user-info" id="userInfo"></span>
            <a href="dashboard.html" class="auth-button" id="dashboardButton" style="display: none; text-decoration: none;">
                <i class="fas fa-tachometer-alt" style="margin-right: 6px;"></i>Dashboard
            </a>
            <a href="auth.html" class="auth-button" id="loginButton" style="display: inline-block; text-decoration: none;">
                <i class="fas fa-sign-in-alt" style="margin-right: 6px;"></i>Sign In
            </a>
        </div>
        
        <button class="mobile-toggle" id="mobileToggle">☰</button>
    </div>
</nav>
`;

// Shared JavaScript for navigation functionality
// Runs immediately when injected — nav HTML is already in the DOM by then
// (do not wait for DOMContentLoaded; that event has usually already fired).
const SHARED_NAVIGATION_JS = `
(function initNavBehaviour() {
    const mobileToggle = document.getElementById('mobileToggle');
    const navMenu = document.getElementById('navMenu');
    const dropdownItems = document.querySelectorAll('.nav-item.has-dropdown');

    function closeAllDropdowns() {
        dropdownItems.forEach(function(item) {
            item.classList.remove('open');
            const trigger = item.querySelector('[data-dropdown-trigger]');
            if (trigger) trigger.setAttribute('aria-expanded', 'false');
        });
    }

    function closeMobileMenu() {
        if (!navMenu || !mobileToggle) return;
        navMenu.classList.remove('mobile-active');
        mobileToggle.textContent = '☰';
        closeAllDropdowns();
    }

    if (mobileToggle && navMenu) {
        mobileToggle.addEventListener('click', function(e) {
            e.stopPropagation();
            const willOpen = !navMenu.classList.contains('mobile-active');
            navMenu.classList.toggle('mobile-active');
            this.textContent = willOpen ? '✕' : '☰';
            if (!willOpen) closeAllDropdowns();
        });
    }

    // Click/tap toggles for labelled dropdowns (needed on touch; useful on desktop)
    dropdownItems.forEach(function(item) {
        const trigger = item.querySelector('[data-dropdown-trigger]');
        if (!trigger) return;

        trigger.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            const isOpen = item.classList.contains('open');
            closeAllDropdowns();
            if (!isOpen) {
                item.classList.add('open');
                trigger.setAttribute('aria-expanded', 'true');
            }
        });
    });

    // Highlight current page (and parent dropdown label when nested)
    const currentPage = window.location.pathname.split('/').pop() || 'index.html';
    document.querySelectorAll('.nav-link[href], .dropdown-link[href]').forEach(function(link) {
        const linkPath = link.getAttribute('href');
        if (!linkPath || linkPath === '#') return;

        const isActive = linkPath === currentPage || (currentPage === '' && linkPath === 'index.html');
        if (isActive) {
            link.classList.add('is-active');
            const parentDropdown = link.closest('.nav-item.has-dropdown');
            if (parentDropdown) {
                const parentTrigger = parentDropdown.querySelector('[data-dropdown-trigger]');
                if (parentTrigger) parentTrigger.classList.add('is-active');
            }
        }

        if (linkPath === 'dashboard.html') {
            link.addEventListener('click', function(e) {
                if (window.supabase && window.config) {
                    e.preventDefault();
                    const supabaseClient = window.getOrCreateSupabaseClient
                        ? window.getOrCreateSupabaseClient()
                        : window.supabase.createClient(window.config.supabaseUrl, window.config.supabaseKey);

                    supabaseClient.auth.getSession().then(function(result) {
                        window.location.href = result.data.session ? 'dashboard.html' : 'auth.html';
                    }).catch(function() {
                        window.location.href = 'auth.html';
                    });
                }
            });
        }
    });

    // Close menus when clicking outside
    document.addEventListener('click', function(event) {
        const insideNav = navMenu && navMenu.contains(event.target);
        const onToggle = mobileToggle && mobileToggle.contains(event.target);

        if (!insideNav && !onToggle) {
            closeAllDropdowns();
            if (window.innerWidth <= 768) closeMobileMenu();
        }
    });

    document.addEventListener('keydown', function(event) {
        if (event.key === 'Escape') {
            closeAllDropdowns();
            closeMobileMenu();
        }
    });
})();

// Update Auth UI function
function updateAuthUI() {
    const loginButton = document.getElementById('loginButton');
    const dashboardButton = document.getElementById('dashboardButton');
    const userInfo = document.getElementById('userInfo');
    
    // Check if config is properly loaded
    if (!window.config || !window.config.supabaseUrl || !window.config.supabaseKey) {
        // Config not loaded yet, show login button as default
        if (loginButton) loginButton.style.display = 'inline-block';
        if (dashboardButton) dashboardButton.style.display = 'none';
        if (userInfo) userInfo.style.display = 'none';
        return;
    }
    
    // Check if Supabase library is available
    if (!window.supabase) {
        console.log('Supabase library not loaded yet');
        if (loginButton) loginButton.style.display = 'inline-block';
        if (dashboardButton) dashboardButton.style.display = 'none';
        if (userInfo) userInfo.style.display = 'none';
        return;
    }
    
    try {
        // Use shared Supabase client instance (created by config-loader.js)
        let supabaseClient = window.getOrCreateSupabaseClient ? window.getOrCreateSupabaseClient() : null;
        
        if (!supabaseClient) {
            // Fallback: create client if shared instance not available
            supabaseClient = window.supabase.createClient(
                window.config.supabaseUrl,
                window.config.supabaseKey
            );
        }
        
        supabaseClient.auth.getSession().then(({ data: { session } }) => {
            if (session) {
                if (loginButton) loginButton.style.display = 'none';
                if (dashboardButton) dashboardButton.style.display = 'inline-block';
                if (userInfo) userInfo.style.display = 'none';
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
    } catch (err) {
        console.error('Error creating Supabase client:', err);
        // Show login button as fallback
        if (loginButton) loginButton.style.display = 'inline-block';
        if (dashboardButton) dashboardButton.style.display = 'none';
        if (userInfo) userInfo.style.display = 'none';
    }
}

// Initialize auth UI updates after navigation is loaded
function initAuthUI() {
    // Wait for config to load first
    document.addEventListener('configLoaded', function() {
        setTimeout(() => {
            updateAuthUI();
            // Listen for auth state changes
            if (window.supabase && window.config) {
                const supabaseClient = window.getOrCreateSupabaseClient ? window.getOrCreateSupabaseClient() : window.supabase.createClient(
                    window.config.supabaseUrl,
                    window.config.supabaseKey
                );
                supabaseClient.auth.onAuthStateChange((event, session) => {
                    updateAuthUI();
                });
            }
        }, 500);
    });
    
    // Also try immediately in case configLoaded already fired
    setTimeout(() => {
        updateAuthUI();
    }, 100);
    
    // And try again after a longer delay to catch late loads
    setTimeout(() => {
        updateAuthUI();
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
                <h4>Play</h4>
                <ul>
                    <li><a href="stats.html">Stats &amp; Profiles</a></li>
                    <li><a href="find-a-match.html">Find a Match</a></li>
                    <li><a href="club-socials.html">Club Socials</a></li>
                    <li><a href="ratings.html">Player Levels</a></li>
                    <li><a href="badges.html">Badges</a></li>
                    <li><a href="boxleague.html">Box League</a></li>
                </ul>
            </div>
            
            <div class="footer-section">
                <h4>Help &amp; legal</h4>
                <ul>
                    <li><a href="guide.html">App Guide</a></li>
                    <li><a href="support.html">Help &amp; Contact</a></li>
                    <li><a href="tip.html">Support the app</a></li>
                    <li><a href="privacy.html">Privacy Policy</a></li>
                    <li><a href="terms.html">Terms</a></li>
                    <li><a href="auth.html">Sign In</a></li>
                </ul>
            </div>
            
            <div class="footer-section">
                <h4>Download</h4>
                <ul>
                    <li><a href="https://apps.apple.com/gb/app/padel-pals/id6742356382">App Store (iOS)</a></li>
                    <li><a href="https://play.google.com/store/apps/details?id=com.playpadelpals.padelpalsandroid">Google Play (Android)</a></li>
                </ul>
            </div>
        </div>
        
        <div class="footer-bottom">
            <p>&copy; 2026 Padel Pals. All rights reserved.</p>
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
    
    // Add navigation HTML to page (banner, then main nav)
    const navContainer = document.createElement('div');
    navContainer.innerHTML = SHARED_NAVIGATION_HTML;
    const nodes = Array.from(navContainer.children);
    // Insert in reverse so the first node ends up first in the document
    for (let i = nodes.length - 1; i >= 0; i--) {
        document.body.insertBefore(nodes[i], document.body.firstChild);
    }
    
    // Add JavaScript functionality
    const script = document.createElement('script');
    script.textContent = SHARED_NAVIGATION_JS;
    document.body.appendChild(script);
    
    // Initialize auth UI after navigation is in place
    initAuthUI();
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
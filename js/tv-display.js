// Big-screen ("show on TV") displays for the dashboard: player rankings,
// a live Americano and a live tournament. Each screen rotates through its
// pages on its own; the mouse brings up controls, the keyboard works too
// (Esc, arrows, space). Styles are in css/tv-display.css.
//
// Data still comes from dashboard.html (allRankedPlayers, americanoDetailData,
// allTournaments …). This file only draws it.

const TV_DEFAULT_PRIMARY = '#FFD700';
const TV_DEFAULT_SECONDARY = '#1A1A1A';
const TV_MIN_CONTRAST = 4.5;
const TV_UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// ── Helpers ───────────────────────────────────────────────────

function tvEsc(value) {
    return String(value ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

function tvHexToRgb(hex) {
    const m = /^#?([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(String(hex || '').trim());
    if (!m) return null;
    let h = m[1];
    if (h.length === 3) h = h.split('').map(c => c + c).join('');
    return [0, 2, 4].map(i => parseInt(h.slice(i, i + 2), 16) / 255);
}

function tvRgbToHex(rgb) {
    return '#' + rgb.map(c => Math.round(Math.min(1, Math.max(0, c)) * 255).toString(16).padStart(2, '0')).join('');
}

function tvLuminance(rgb) {
    const ch = c => (c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4));
    return 0.2126 * ch(rgb[0]) + 0.7152 * ch(rgb[1]) + 0.0722 * ch(rgb[2]);
}

function tvContrast(a, b) {
    const l1 = tvLuminance(a);
    const l2 = tvLuminance(b);
    return (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
}

// Same rule as the iOS app (ColorThemeManager.contrastSafePair): move the
// background towards black or white until the primary reads at 4.5:1.
function tvContrastSafePair(primaryHex, secondaryHex) {
    const fallbackP = tvHexToRgb(TV_DEFAULT_PRIMARY);
    const fallbackS = tvHexToRgb(TV_DEFAULT_SECONDARY);
    const primary = tvHexToRgb(primaryHex) || fallbackP;
    const secondary = tvHexToRgb(secondaryHex) || fallbackS;
    if (tvContrast(primary, secondary) >= TV_MIN_CONTRAST) return [primary, secondary];

    const blend = target => Array.from({ length: 13 }, (_, step) => secondary.map((c, i) => c + (target[i] - c) * (step / 12)));
    const pick = list => list.find(c => tvContrast(primary, c) >= TV_MIN_CONTRAST) || list[list.length - 1];
    const towardBlack = pick(blend([0, 0, 0]));
    const towardWhite = pick(blend([1, 1, 1]));
    const blackRatio = tvContrast(primary, towardBlack);
    const whiteRatio = tvContrast(primary, towardWhite);
    if (Math.max(blackRatio, whiteRatio) >= TV_MIN_CONTRAST) {
        return [primary, blackRatio >= whiteRatio ? towardBlack : towardWhite];
    }
    if (tvContrast(primary, fallbackS) >= TV_MIN_CONTRAST) return [primary, fallbackS];
    return [fallbackP, fallbackS];
}

function tvClub() {
    const club = window.currentUserClubData || {};
    const [primary, secondary] = tvContrastSafePair(
        club.primary_color || club.primaryColor,
        club.secondary_color || club.secondaryColor
    );
    // White text sits on the background too, so keep the background dark.
    const dark = tvLuminance(secondary) > 0.18 ? tvHexToRgb(TV_DEFAULT_SECONDARY) : secondary;
    const safe = tvContrast(primary, dark) >= TV_MIN_CONTRAST
        ? [primary, dark]
        : [tvHexToRgb(TV_DEFAULT_PRIMARY), tvHexToRgb(TV_DEFAULT_SECONDARY)];
    return {
        name: club.club_name || '',
        logo: club.logo_url || '',
        primary: tvRgbToHex(safe[0]),
        primaryRgb: safe[0].map(c => Math.round(c * 255)).join(', '),
        secondary: tvRgbToHex(safe[1])
    };
}

// ── Light or dark ─────────────────────────────────────────────
// One choice for every TV screen, kept in localStorage. Dark is the default.
// ?theme=light (or dark) in the page address sets it too.
const TV_THEME_KEY = 'pp_tv_theme';

function tvStoredTheme() {
    try {
        const asked = new URLSearchParams(location.search).get('theme');
        if (asked === 'light' || asked === 'dark') {
            try { localStorage.setItem(TV_THEME_KEY, asked); } catch (_) {}
            return asked;
        }
    } catch (_) {}
    try { return localStorage.getItem(TV_THEME_KEY) === 'light' ? 'light' : 'dark'; } catch (_) { return 'dark'; }
}

let tvTheme = tvStoredTheme();

function tvSetTheme(theme) {
    tvTheme = theme === 'light' ? 'light' : 'dark';
    try { localStorage.setItem(TV_THEME_KEY, tvTheme); } catch (_) {}
    document.querySelectorAll('.tv-screen').forEach(el => el.__tv && el.__tv.applyTheme());
}

// Light palette from the club colour: a barely-there tint for the background,
// and the club colour darkened (towards black) until it reads at 4.5:1 on it.
function tvLightPalette(club) {
    const brand = tvHexToRgb(club.primary);
    const bg = brand.map(c => 1 - (1 - c) * 0.06);
    let text = brand;
    for (let step = 1; tvContrast(text, bg) < TV_MIN_CONTRAST && step <= 20; step++) {
        text = brand.map(c => c * (1 - step * 0.045));
    }
    return { bg: tvRgbToHex(bg), text: tvRgbToHex(text) };
}

function tvInitials(name) {
    const parts = String(name || '').trim().split(/\s+/).filter(Boolean);
    if (!parts.length) return '?';
    const first = parts[0][0];
    const last = parts.length > 1 ? parts[parts.length - 1][0] : '';
    return (first + last).toUpperCase();
}

function tvSupabase() {
    if (typeof getAmericanoSupabaseClient === 'function') return getAmericanoSupabaseClient();
    if (typeof supabaseClient !== 'undefined' && supabaseClient) return supabaseClient;
    return null;
}

// ── Avatars ───────────────────────────────────────────────────

const tvAvatarUrls = new Map(); // user id -> photo URL, or '' for none

function tvSeedAvatar(userId, url) {
    if (userId && url && !tvAvatarUrls.get(userId)) tvAvatarUrls.set(userId, url);
}

// Loads photos for ids we have not asked about. Resolves true if any arrived.
async function tvLoadAvatars(ids) {
    const missing = [...new Set(ids)].filter(id => id && TV_UUID.test(id) && !tvAvatarUrls.has(id));
    if (!missing.length) return false;
    const client = tvSupabase();
    if (!client) return false;
    missing.forEach(id => tvAvatarUrls.set(id, ''));
    let found = false;
    for (let i = 0; i < missing.length; i += 100) {
        const { data, error } = await client
            .from('user_profiles')
            .select('id, avatar_url')
            .in('id', missing.slice(i, i + 100));
        if (error) { console.warn('tvLoadAvatars', error); continue; }
        (data || []).forEach(row => {
            if (row.avatar_url) { tvAvatarUrls.set(row.id, row.avatar_url); found = true; }
        });
    }
    return found;
}

function tvAvatar(name, userId, extraClass) {
    const url = userId ? tvAvatarUrls.get(userId) : '';
    return `<span class="tv-av ${extraClass || ''}">${tvEsc(tvInitials(name))}${url
        ? `<img src="${tvEsc(url)}" alt="" decoding="async" onerror="this.remove()">`
        : ''}</span>`;
}

function tvPairAvatars(people, extraClass) {
    return `<span class="tv-pair">${people.map(p => (p.open
        ? `<span class="tv-av tv-av-open ${extraClass || ''}">+</span>`
        : tvAvatar(p.name, p.id, extraClass))).join('')}</span>`;
}

// Shrinks long names a little rather than cutting them off.
function tvFitText(root) {
    root.querySelectorAll('.tv-name, .tv-team-names div, .tv-tie-name, .tv-podium-name, .tv-champion-name, .tv-box-names div, .tv-fx-name').forEach(el => {
        el.style.fontSize = '';
        let size = parseFloat(getComputedStyle(el).fontSize);
        const floor = size * 0.7;
        while ((el.scrollWidth > el.clientWidth + 1 || el.scrollHeight > el.clientHeight + 1) && size > floor) {
            size *= 0.94;
            el.style.fontSize = `${size}px`;
        }
    });
}

function tvPreload(ids) {
    ids.forEach(id => {
        const url = tvAvatarUrls.get(id);
        if (url) { const img = new Image(); img.src = url; }
    });
}

// ── Shared building blocks ────────────────────────────────────

// rows: [{ rank, name, id, people?, value, unit?, meta? }]. Ten per column.
function tvTableHtml(rows) {
    if (!rows.length) return '<div class="tv-empty">Nothing to show yet</div>';
    const single = rows.length <= 10;
    const perCol = single ? rows.length : Math.ceil(rows.length / 2);
    const cells = rows.map((r, i) => {
        const top = r.rank <= 3 ? ` tv-top-${r.rank}` : '';
        const ring = r.rank <= 3 ? `tv-ring-${r.rank}` : '';
        const face = r.people ? tvPairAvatars(r.people) : tvAvatar(r.name, r.id, ring);
        return `<div class="tv-row tv-rise${top}" style="--i:${i}">
            <div class="tv-rank">${r.rank}</div>
            ${face}
            <div class="tv-name">${tvEsc(r.name)}</div>
            ${r.meta ? `<div class="tv-meta">${tvEsc(r.meta)}</div>` : ''}
            <div class="tv-pill">${tvEsc(r.value)}${r.unit ? `<small>${tvEsc(r.unit)}</small>` : ''}</div>
        </div>`;
    }).join('');
    return `<div class="tv-table${single ? ' tv-single' : ''}" style="--cols:${single ? 1 : 2};--rows:${perCol}">${cells}</div>`;
}

// spots: the top three as { name, id, people?, value, unit? }, best first.
function tvPodiumHtml(spots) {
    const order = [1, 0, 2].filter(i => spots[i]);
    return `<div class="tv-podium">${order.map((i, n) => {
        const s = spots[i];
        const place = i + 1;
        const face = s.people
            ? tvPairAvatars(s.people, `tv-ring-${place}`)
            : tvAvatar(s.name, s.id, `tv-ring-${place}`);
        return `<div class="tv-podium-spot tv-place-${place} tv-pop" style="--i:${place === 1 ? 2 : n}">
            ${place === 1 ? '<div class="tv-crown"><i class="fas fa-crown"></i></div>' : ''}
            ${face}
            <div class="tv-podium-name">${tvEsc(s.name)}</div>
            <div class="tv-pill">${tvEsc(s.value)}${s.unit ? `<small>${tvEsc(s.unit)}</small>` : ''}</div>
            <div class="tv-plinth">${place}</div>
        </div>`;
    }).join('')}</div>`;
}

function tvCourtsHtml(cards) {
    const n = cards.length;
    const cols = n <= 1 ? 1 : n <= 4 ? 2 : 3;
    const rows = Math.ceil(n / cols);
    const scale = rows <= 1 ? (cols === 3 ? 1 : 1.3) : rows === 2 ? 0.9 : 0.68;
    // One row of cards sits in the middle at its natural height.
    const oneRow = rows <= 1 ? 'grid-auto-rows:auto;align-content:center;' : '';
    return `<div class="tv-courts" style="--cols:${cols};--s:${scale};${oneRow}${n === 1 ? 'max-width:70rem;width:100%;margin:0 auto;' : ''}">${cards.join('')}</div>`;
}

// side: { people: [{name,id}], score, sets?, state: 'win'|'lose'|'' }
// note: an optional line under the heading, such as "Box league · Div 3".
function tvCourtCard(index, title, chip, chipLive, done, sides, extraClass, note) {
    const team = side => `<div class="tv-team ${side.state ? 'tv-' + side.state : ''}">
        ${tvPairAvatars(side.people)}
        <div class="tv-team-names">${side.people.map(p => `<div${p.open ? ' class="tv-open-place"' : ''}>${tvEsc(p.name)}</div>`).join('')}</div>
        ${side.sets ? `<span class="tv-sets">${tvEsc(side.sets)}</span>` : ''}
        <div class="tv-team-score${side.score == null ? ' tv-unplayed' : ''}">${side.score == null ? '–' : tvEsc(side.score)}</div>
    </div>`;
    return `<div class="tv-court tv-rise${done ? ' tv-court-done' : ''}${extraClass ? ' ' + extraClass : ''}" style="--i:${index * 2}">
        <div class="tv-court-head"><span>${tvEsc(title)}</span>${chip ? `<span class="tv-chip${chipLive ? ' tv-chip-live' : ''}">${tvEsc(chip)}</span>` : ''}</div>
        ${note ? `<div class="tv-court-note">${tvEsc(note)}</div>` : ''}
        ${team(sides[0])}
        <div class="tv-vs">VS</div>
        ${team(sides[1])}
    </div>`;
}

// ── Screen ────────────────────────────────────────────────────

// A page is { key, label, now, html(), ids[] }, and optionally header() for
// its own status strip, group (pages that sit together on the rail), nowLabel
// and ms (how long it shows). The screen keeps the page index across data
// refreshes and only animates when the page changes.
class TvScreen {
    constructor({ id, ariaLabel, rotateMs, pages, header, extraControls, onClose, compactRail }) {
        this.id = id;
        this.ariaLabel = ariaLabel;
        this.rotateMs = rotateMs;
        this.compactRail = !!compactRail;
        this.buildPages = pages;
        this.buildHeader = header;
        this.extraControls = extraControls || '';
        this.onClose = onClose;
        this.pages = [];
        this.index = 0;
        this.rotating = true;
        this.timer = null;
        this.frame = null;
        this.clockTimer = null;
        this.idleTimer = null;
        this.lastHtml = '';
        this.lastRail = '';
        this.swapToken = 0;
        this.wakeLock = null;
        this.onKey = this.onKey.bind(this);
        this.onWake = this.onWake.bind(this);
    }

    get el() { return document.getElementById(this.id); }
    get isOpen() { return !!this.el?.classList.contains('active'); }

    mount() {
        if (this.el) return this.el;
        const el = document.createElement('div');
        el.id = this.id;
        el.className = this.compactRail ? 'tv-screen tv-compact-rail' : 'tv-screen';
        el.setAttribute('role', 'dialog');
        el.setAttribute('aria-modal', 'true');
        el.setAttribute('aria-label', this.ariaLabel);
        el.innerHTML = `
            <div class="tv-backdrop"></div>
            <header class="tv-strip">
                <div class="tv-logo"></div>
                <div class="tv-heading">
                    <h1 class="tv-title"></h1>
                    <div class="tv-status"><span class="tv-stage"></span><span class="tv-detail"></span></div>
                    <div class="tv-progress" hidden><span></span></div>
                </div>
                <div class="tv-now"><div class="tv-now-label">Now showing</div><div class="tv-now-value"></div></div>
                <div class="tv-clock"></div>
            </header>
            <main class="tv-main"><div class="tv-page"></div></main>
            <footer class="tv-rail">
                <div class="tv-segments"></div>
                <div class="tv-countdown"></div>
                <div class="tv-brand">PadelPals</div>
            </footer>
            <div class="tv-controls">
                ${this.extraControls}
                <button type="button" data-tv="prev" title="Previous (←)"><i class="fas fa-chevron-left"></i></button>
                <button type="button" data-tv="pause" title="Pause or resume (space)"><i class="fas fa-pause"></i></button>
                <button type="button" data-tv="next" title="Next (→)"><i class="fas fa-chevron-right"></i></button>
                <span class="tv-gap"></span>
                <button type="button" data-tv="theme"></button>
                <button type="button" class="tv-exit" data-tv="exit" title="Exit (Esc)"><i class="fas fa-compress me-1"></i>Exit</button>
            </div>`;
        el.querySelector('.tv-controls').addEventListener('click', e => {
            const btn = e.target.closest('button[data-tv]');
            if (!btn) return;
            const action = btn.dataset.tv;
            if (action === 'prev') this.step(-1);
            else if (action === 'next') this.step(1);
            else if (action === 'pause') this.toggleRotate();
            else if (action === 'theme') tvSetTheme(tvTheme === 'light' ? 'dark' : 'light');
            else if (action === 'exit') this.close();
        });
        el.__tv = this;
        el.addEventListener('mousemove', this.onWake);
        document.body.appendChild(el);
        return el;
    }

    applyTheme() {
        const club = tvClub();
        const el = this.el;
        const light = tvTheme === 'light';
        const pal = light ? tvLightPalette(club) : null;
        el.classList.toggle('tv-light', light);
        el.style.setProperty('--tv-primary', light ? pal.text : club.primary);
        el.style.setProperty('--tv-primary-rgb', club.primaryRgb);
        el.style.setProperty('--tv-fill', club.primary);
        el.style.setProperty('--tv-secondary', light ? pal.bg : club.secondary);
        // Logos are made for dark backgrounds, so in light mode they keep the club's dark colour behind them.
        el.style.setProperty('--tv-logo-bg', light ? club.secondary : '');
        const toggle = el.querySelector('[data-tv="theme"]');
        if (toggle) {
            toggle.innerHTML = light ? '<i class="fas fa-moon me-1"></i>Dark' : '<i class="fas fa-sun me-1"></i>Light';
            toggle.title = light ? 'Switch to the dark screen (T)' : 'Switch to the light screen (T)';
        }
        const logo = el.querySelector('.tv-logo');
        if (club.logo) {
            logo.className = 'tv-logo';
            logo.innerHTML = `<img src="${tvEsc(club.logo)}" alt="${tvEsc(club.name ? club.name + ' logo' : 'Club logo')}">`;
            logo.querySelector('img').onerror = () => {
                logo.className = 'tv-logo tv-logo-text';
                logo.textContent = tvInitials(club.name || 'Padel Pals');
            };
        } else {
            logo.className = 'tv-logo tv-logo-text';
            logo.textContent = tvInitials(club.name || 'Padel Pals');
        }
    }

    open() {
        const el = this.mount();
        tvTheme = tvStoredTheme();
        this.applyTheme();
        this.index = 0;
        this.rotating = true;
        this.lastHtml = '';
        this.lastRail = '';
        el.classList.add('active');
        document.documentElement.classList.add('tv-open');
        document.body.style.overflow = 'hidden';
        document.addEventListener('keydown', this.onKey);
        this.tickClock();
        this.clockTimer = setInterval(() => this.tickClock(), 10000);
        this.render(true);
        this.startRotate();
        this.requestWakeLock();
        try {
            if (!document.fullscreenElement && el.requestFullscreen) el.requestFullscreen().catch(() => {});
        } catch (e) { /* the overlay still fills the window */ }
    }

    close() {
        const el = this.el;
        if (!el) return;
        this.stopRotate();
        clearInterval(this.clockTimer);
        clearTimeout(this.idleTimer);
        el.classList.remove('active', 'tv-awake');
        document.documentElement.classList.remove('tv-open');
        document.body.style.overflow = '';
        document.removeEventListener('keydown', this.onKey);
        if (this.wakeLock) { this.wakeLock.release().catch(() => {}); this.wakeLock = null; }
        if (document.fullscreenElement === el && document.exitFullscreen) document.exitFullscreen().catch(() => {});
        if (this.onClose) this.onClose();
    }

    async requestWakeLock() {
        try {
            if (navigator.wakeLock) this.wakeLock = await navigator.wakeLock.request('screen');
        } catch (e) { /* not supported or refused */ }
    }

    onKey(e) {
        if (!this.isOpen) return;
        if (e.key === 'Escape') this.close();
        else if (e.key === 'ArrowRight') this.step(1);
        else if (e.key === 'ArrowLeft') this.step(-1);
        else if (e.key === 't' || e.key === 'T') tvSetTheme(tvTheme === 'light' ? 'dark' : 'light');
        else if (e.key === ' ') { e.preventDefault(); this.toggleRotate(); }
    }

    onWake() {
        const el = this.el;
        el.classList.add('tv-awake');
        clearTimeout(this.idleTimer);
        this.idleTimer = setTimeout(() => el.classList.remove('tv-awake'), 2500);
    }

    tickClock() {
        const clock = this.el?.querySelector('.tv-clock');
        if (clock) clock.textContent = new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
    }

    // Call after the data changes. Redraws in place unless the page changed.
    refresh() {
        if (this.isOpen) this.render(false);
    }

    render(animate) {
        const el = this.el;
        if (!el) return;
        this.pages = this.buildPages();
        if (!this.pages.length) this.pages = [{ key: 'empty', label: '', now: '', html: () => '<div class="tv-empty">Nothing to show yet</div>', ids: [] }];
        if (this.index >= this.pages.length) this.index = 0;
        const page = this.pages[this.index];

        const head = (page.header ? page.header() : this.buildHeader?.()) || {};
        el.querySelector('.tv-title').textContent = head.title || '';
        const stage = el.querySelector('.tv-stage');
        stage.textContent = head.stage || '';
        stage.classList.toggle('tv-live', !!head.live);
        el.querySelector('.tv-detail').textContent = head.detail || '';
        const progress = el.querySelector('.tv-progress');
        if (head.progress != null) {
            progress.hidden = false;
            progress.firstElementChild.style.width = `${Math.round(Math.min(1, Math.max(0, head.progress)) * 100)}%`;
        } else {
            progress.hidden = true;
        }
        el.querySelector('.tv-now-label').textContent = page.nowLabel || 'Now showing';
        el.querySelector('.tv-now-value').textContent = page.now || page.label || '';

        this.renderRail();

        // Fetch faces for every page once; redraw quietly when they arrive.
        const allIds = this.pages.flatMap(p => p.ids || []);
        tvLoadAvatars(allIds).then(found => { if (found && this.isOpen) { this.lastHtml = ''; this.render(false); } });

        const html = page.html();
        const pageEl = el.querySelector('.tv-page');
        if (!animate) {
            if (html !== this.lastHtml && !pageEl.classList.contains('tv-out')) {
                pageEl.classList.remove('tv-in');
                pageEl.innerHTML = html;
                this.lastHtml = html;
                tvFitText(pageEl);
            }
        } else {
            const token = ++this.swapToken;
            const swap = () => {
                if (token !== this.swapToken) return;
                // Rebuild now: photos or scores may have arrived during the fade.
                const fresh = (this.pages[this.index] || page).html();
                pageEl.innerHTML = fresh;
                this.lastHtml = fresh;
                tvFitText(pageEl);
                pageEl.classList.remove('tv-out', 'tv-in');
                void pageEl.offsetWidth;
                pageEl.classList.add('tv-in');
            };
            if (pageEl.innerHTML) {
                pageEl.classList.add('tv-out');
                setTimeout(swap, 350);
            } else {
                swap();
            }
        }

        const next = this.pages[(this.index + 1) % this.pages.length];
        if (next) tvPreload(next.ids || []);
    }

    // Pages with a `group` (a league, say) sit together under its name.
    renderRail() {
        const el = this.el;
        const sig = this.pages.map(p => `${p.group || ''}/${p.label}`).join('|') + '#' + this.index;
        if (sig === this.lastRail) return;
        this.lastRail = sig;
        const seg = (p, i) => `
            <div class="tv-seg${i < this.index ? ' tv-done' : ''}${i === this.index ? ' tv-current' : ''}">
                <div class="tv-seg-bar"><div class="tv-seg-fill"></div></div>
                <div class="tv-seg-label">${tvEsc(p.label)}</div>
            </div>`;
        let html = '';
        if (this.pages.length >= 2) {
            const grouped = this.pages.some(p => p.group);
            let i = 0;
            while (i < this.pages.length) {
                const group = this.pages[i].group;
                let j = i;
                while (j < this.pages.length && this.pages[j].group === group) j++;
                const segs = this.pages.slice(i, j).map((p, n) => seg(p, i + n)).join('');
                html += grouped
                    ? `<div class="tv-seg-group${this.index >= i && this.index < j ? ' tv-current' : ''}" style="flex:${j - i}">
                        <div class="tv-seg-group-name">${tvEsc(group || '')}</div><div class="tv-seg-group-segs">${segs}</div></div>`
                    : segs;
                i = j;
            }
        }
        el.querySelector('.tv-segments').innerHTML = html;
        this.updateCountdown(0);
    }

    updateCountdown(elapsed) {
        const el = this.el;
        const out = el.querySelector('.tv-countdown');
        const fill = el.querySelector('.tv-seg.tv-current .tv-seg-fill');
        if (this.pages.length < 2) { out.textContent = ''; return; }
        if (!this.rotating) {
            out.textContent = 'Paused';
            if (fill) fill.style.transform = 'scaleX(0)';
            return;
        }
        const pct = Math.min(1, elapsed / this.pageMs());
        if (fill) fill.style.transform = `scaleX(${pct})`;
        const next = this.pages[(this.index + 1) % this.pages.length];
        const secs = Math.max(1, Math.ceil((this.pageMs() - elapsed) / 1000));
        // Moving on to another league names the league, not its first division.
        const nextName = next.group && next.group !== this.pages[this.index].group ? next.group : next.label;
        out.textContent = `${nextName} in ${secs}s`;
    }

    pageMs() {
        return this.pages[this.index]?.ms || this.rotateMs;
    }

    startRotate() {
        this.stopRotate();
        const btn = this.el.querySelector('[data-tv="pause"] i');
        if (btn) btn.className = this.rotating ? 'fas fa-pause' : 'fas fa-play';
        if (!this.rotating || this.pages.length < 2) { this.updateCountdown(0); return; }
        const start = performance.now();
        const ms = this.pageMs();
        const tick = now => {
            this.updateCountdown(now - start);
            if (now - start < ms) this.frame = requestAnimationFrame(tick);
        };
        this.frame = requestAnimationFrame(tick);
        this.timer = setTimeout(() => this.step(1), ms);
    }

    stopRotate() {
        clearTimeout(this.timer);
        cancelAnimationFrame(this.frame);
        this.timer = null;
        this.frame = null;
    }

    toggleRotate() {
        this.rotating = !this.rotating;
        this.startRotate();
    }

    step(dir) {
        const n = this.pages.length;
        if (!n) return;
        this.index = (this.index + dir + n) % n;
        this.render(true);
        this.startRotate();
    }

    goTo(index) {
        this.index = index;
        this.render(true);
        this.startRotate();
    }
}

// ── Player rankings ───────────────────────────────────────────

const FS_MAX_PLAYERS = 100;
const FS_PAGE_SIZE = 20;
const FS_ROTATE_MS = 8000;

let rankingsFsGender = 'all';

function rankingsFsGetFilteredPlayers() {
    // allRankedPlayers is already limited to rating activity within 4 months
    let players = (typeof allRankedPlayers !== 'undefined' ? allRankedPlayers : []);
    if (typeof clubMemberIdsSet !== 'undefined' && clubMemberIdsSet && clubMemberIdsSet.size > 0) {
        players = players.filter(p => clubMemberIdsSet.has(p.id));
    }
    if (rankingsFsGender !== 'all') {
        const gCache = (typeof playerGenderCache !== 'undefined' ? playerGenderCache : new Map());
        players = players.filter(p => gCache.get(p.id) === rankingsFsGender);
    }
    return players;
}

// source: leaderboard rows ({ id, display_name, rating_0_10, avatar_url }), best first.
function rankingsTvPages(source = rankingsFsGetFilteredPlayers(), maxPages = Infinity) {
    const names = (typeof playerProfilesCache !== 'undefined' ? playerProfilesCache : new Map());
    const players = source.slice(0, FS_MAX_PLAYERS).map((p, i) => {
        tvSeedAvatar(p.id, p.avatar_url);
        return {
            rank: i + 1,
            id: p.id,
            name: p.display_name || names.get(p.id) || 'Player',
            value: typeof p.rating_0_10 === 'number' ? p.rating_0_10.toFixed(2) : '—'
        };
    });
    const pages = [];
    if (players.length >= 3) {
        const top = players.slice(0, 3);
        pages.push({ key: 'podium', label: 'Top 3', now: 'Top three', ids: top.map(p => p.id), html: () => tvPodiumHtml(top) });
    }
    for (let start = 0; start < players.length; start += FS_PAGE_SIZE) {
        const rows = players.slice(start, start + FS_PAGE_SIZE);
        const label = `${start + 1}–${start + rows.length}`;
        pages.push({ key: 'p' + start, label, now: `Places ${label}`, ids: rows.map(r => r.id), html: () => tvTableHtml(rows) });
    }
    const shown = pages.slice(0, maxPages);
    shown.forEach(page => { page.header = () => rankingsTvHeader(players.length); });
    return shown;
}

function rankingsTvHeader(count) {
    const club = window.currentUserClubData;
    const gender = rankingsFsGender === 'all' ? '' : (rankingsFsGender === 'male' ? 'Men · ' : 'Women · ');
    return {
        title: club?.club_name ? `${club.club_name} rankings` : 'Player rankings',
        stage: 'Leaderboard',
        detail: count
            ? `${gender}Top ${count} player${count === 1 ? '' : 's'} · active in the last 4 months`
            : `${gender}No rated players in the last 4 months`
    };
}

const rankingsTv = new TvScreen({
    id: 'rankingsFullscreenOverlay',
    ariaLabel: 'Player rankings on TV',
    rotateMs: FS_ROTATE_MS,
    pages: () => rankingsTvPages(),
    header: () => rankingsTvHeader(0),
    extraControls: `
        <button type="button" data-gender="all" onclick="rankingsFsSetGender('all')">All</button>
        <button type="button" data-gender="male" onclick="rankingsFsSetGender('male')">Men</button>
        <button type="button" data-gender="female" onclick="rankingsFsSetGender('female')">Women</button>
        <span class="tv-gap"></span>`
});

function openRankingsFullscreen() {
    const mainGender = document.getElementById('genderFilter');
    rankingsTv.mount();
    rankingsFsSetGender(mainGender ? mainGender.value : 'all', true);
    rankingsTv.open();
}

function closeRankingsFullscreen() {
    rankingsTv.close();
}

async function rankingsFsSetGender(gender, quiet) {
    rankingsFsGender = gender;
    rankingsTv.el?.querySelectorAll('[data-gender]').forEach(btn => btn.classList.toggle('tv-on', btn.dataset.gender === gender));
    if (gender !== 'all' && typeof ensureGenderDataForPlayers === 'function') {
        const all = (typeof allRankedPlayers !== 'undefined' ? allRankedPlayers : []);
        const base = (typeof clubMemberIdsSet !== 'undefined' && clubMemberIdsSet && clubMemberIdsSet.size > 0)
            ? all.filter(p => clubMemberIdsSet.has(p.id))
            : all;
        await ensureGenderDataForPlayers(base);
    }
    if (!quiet && rankingsTv.isOpen) rankingsTv.goTo(0);
}

// ── Americano ─────────────────────────────────────────────────

const AFS_PAGE_SIZE = 20;
const AFS_ROTATE_MS = 8000;
const AFS_MAX_PLAYERS = 100;

function americanoTvPeople(list) {
    return (list || []).map(p => ({ name: p.name || 'Player', id: p.user_id || p.userId || null }));
}

// data: what get_americano_by_token returns for one session.
function americanoTvPages(data = americanoDetailData) {
    if (!data?.session) return [];
    const s = data.session;
    const live = s.payload || {};
    const pointsToWin = live.points_to_win || s.points_to_win || 24;
    const idByName = {};
    (live.players || []).forEach(p => { idByName[p.name] = p.user_id || p.userId || null; });
    const rows = standingsFromAmericanoPayload(data).slice(0, AFS_MAX_PLAYERS).map((r, i) => ({
        rank: i + 1,
        name: r.name,
        id: idByName[r.name] || null,
        value: r.pts,
        unit: 'pts',
        meta: `${r.wins}W · ${r.gp}P`
    }));
    const round = getAmericanoCurrentRound(live);
    const fixtures = round?.fixtures || [];
    const pages = [];

    const courtsPage = () => {
        const cards = fixtures.map((f, i) => {
            const played = f.team1_score != null;
            const s1 = played ? f.team1_score : null;
            const s2 = played ? pointsToWin - f.team1_score : null;
            const state = (a, b) => (!played || a === b ? '' : a > b ? 'win' : 'lose');
            return tvCourtCard(i, f.court != null ? `Court ${f.court}` : `Match ${i + 1}`,
                played ? 'Final' : 'In play', !played, played, [
                    { people: americanoTvPeople(f.team1), score: s1, state: state(s1, s2) },
                    { people: americanoTvPeople(f.team2), score: s2, state: state(s2, s1) }
                ]);
        });
        const sitting = americanoTvPeople(round.sitting_out);
        const bench = sitting.length ? `<div class="tv-bench tv-rise" style="--i:${cards.length * 2}">
            <span class="tv-bench-label">Sitting out</span>
            ${sitting.map(p => `<span class="tv-bench-player">${tvAvatar(p.name, p.id)}${tvEsc(p.name)}</span>`).join('')}
        </div>` : '';
        return tvCourtsHtml(cards) + bench;
    };
    const fixtureIds = fixtures.flatMap(f => [...americanoTvPeople(f.team1), ...americanoTvPeople(f.team2)].map(p => p.id))
        .concat(americanoTvPeople(round?.sitting_out).map(p => p.id));

    if (s.status === 'completed' && rows.length >= 3) {
        const top = rows.slice(0, 3);
        pages.push({ key: 'podium', label: 'Winners', now: 'Final podium', ids: top.map(r => r.id), html: () => tvPodiumHtml(top) });
    }
    if (s.status !== 'completed' && fixtures.length) {
        pages.push({ key: 'courts', label: `Round ${round.round_number || s.current_round || 1}`, now: 'On court', ids: fixtureIds, html: courtsPage });
    }
    const tableLabel = s.status === 'completed' ? 'Final table' : 'Table';
    for (let start = 0; start < Math.max(rows.length, 1); start += AFS_PAGE_SIZE) {
        const slice = rows.slice(start, start + AFS_PAGE_SIZE);
        const many = rows.length > AFS_PAGE_SIZE;
        const label = many ? `${tableLabel} ${start + 1}–${start + slice.length}` : tableLabel;
        pages.push({
            key: 't' + start,
            label,
            now: many ? `Places ${start + 1}–${start + slice.length}` : (s.status === 'completed' ? 'Final table' : 'Standings'),
            ids: slice.map(r => r.id),
            html: () => slice.length ? tvTableHtml(slice) : '<div class="tv-empty">No scores yet. The table fills in as courts finish.</div>'
        });
    }
    if (s.status === 'completed' && fixtures.length) {
        pages.push({ key: 'courts', label: 'Last round', now: 'Last round', ids: fixtureIds, html: courtsPage });
    }
    pages.forEach(page => { page.header = () => americanoTvHeader(data); });
    return pages;
}

function americanoTvHeader(data) {
    const s = data?.session;
    if (!s) return {};
    const live = s.payload || {};
    const done = s.status === 'completed';
    const round = s.current_round || live.current_round || 1;
    const format = live.play_format === 'mexicano' ? 'Mexicano' : 'Americano';
    const courts = live.number_of_courts ? ` · ${live.number_of_courts} court${live.number_of_courts === 1 ? '' : 's'}` : '';
    const players = (live.players || []).length;
    const current = getAmericanoCurrentRound(live);
    const fixtures = current?.fixtures || [];
    const scored = fixtures.filter(f => f.team1_score != null).length;
    const planned = Number(s.planned_rounds) || 0;
    const roundPart = fixtures.length ? scored / fixtures.length : 0;
    return {
        title: s.session_name || 'Americano',
        stage: done ? 'Final' : 'Live',
        live: !done,
        detail: done
            ? `${format} · ${round} rounds · ${players} players`
            : `Round ${round}${planned ? ` of ${planned}` : ''} · ${scored} of ${fixtures.length} courts in · ${format}${courts}`,
        progress: done ? null : (planned ? Math.min(1, (round - 1 + roundPart) / planned) : roundPart)
    };
}

const americanoTv = new TvScreen({
    id: 'americanoFullscreenOverlay',
    ariaLabel: 'Americano on TV',
    rotateMs: AFS_ROTATE_MS,
    pages: () => americanoTvPages(),
    header: () => americanoTvHeader(americanoDetailData),
    onClose: () => {
        const modalEl = document.getElementById('americanoModal');
        if (!modalEl?.classList.contains('show') && typeof stopAmericanoPolling === 'function') stopAmericanoPolling();
    }
});

function openAmericanoFullscreen() {
    if (!americanoDetailData?.session) return;
    const status = americanoDetailData.session.status;
    if (status !== 'live' && status !== 'completed') return;
    americanoTv.open();
    if (typeof maybeStartAmericanoPolling === 'function') maybeStartAmericanoPolling();
}

function closeAmericanoFullscreen() {
    americanoTv.close();
}

// Called by refreshAmericanoDetail on every poll.
function americanoFsRenderPage() {
    americanoTv.refresh();
}

// ── Tournament ────────────────────────────────────────────────

const TOURNAMENT_FS_ROTATE_MS = 8000;

function tournamentTvPeople(team) {
    if (!team) return [];
    const people = [{ name: (team.player1_name || '').trim() || 'Player', id: team.player1_id || null }];
    if ((team.player2_name || '').trim()) people.push({ name: team.player2_name.trim(), id: team.player2_id || null });
    return people;
}

function tournamentTvShortName(team) {
    if (!team) return 'TBD';
    const first = n => (n || '').trim().split(/\s+/)[0] || '';
    return team.player2_name ? `${first(team.player1_name)} & ${first(team.player2_name)}` : (team.player1_name || 'TBD');
}

function tvOrdinal(n) {
    const tail = n % 100 >= 11 && n % 100 <= 13 ? 'th' : ({ 1: 'st', 2: 'nd', 3: 'rd' }[n % 10] || 'th');
    return `${n}${tail}`;
}

function tournamentTvRoundTitle(match, board) {
    if (match.knockout_role === 'third_place') return 'Third place';
    if (match.knockout_role === 'placement') return 'Placing match';
    if (match.knockout_role === 'plate') {
        if (board.platePlayoffIds.has(match.id)) return `${tvOrdinal(board.mainSize + 3)} place`;
        return `Plate ${bracketRoundLabel(match.round, board.plateRounds).toLowerCase()}`;
    }
    return bracketRoundLabel(match.round, board.totalRounds);
}

// The plate is its own path: silver, not the club colour.
function tournamentTvCardClass(match) {
    return match.knockout_role === 'plate' ? 'tv-plate' : '';
}

// Teams, matches and groups by tournament id. The dashboard's own by default.
function tournamentTvStore() {
    return {
        teams: typeof allTournamentTeams !== 'undefined' ? allTournamentTeams : {},
        matches: typeof allTournamentMatches !== 'undefined' ? allTournamentMatches : {},
        groups: typeof allTournamentGroups !== 'undefined' ? allTournamentGroups : {}
    };
}

function tournamentTvBoard(tournament, store = tournamentTvStore()) {
    const teams = store.teams[tournament.id] || [];
    const matches = (store.matches[tournament.id] || []).slice()
        .sort((a, b) => (a.round || 0) - (b.round || 0) || (a.match_number || 0) - (b.match_number || 0));
    const groups = store.groups[tournament.id] || [];
    const teamsById = {};
    teams.forEach(t => { teamsById[t.id] = t; });
    const isBye = m => m.is_completed && (!m.team1_id || !m.team2_id);
    const playable = matches.filter(m => m.team1_id && m.team2_id && !isBye(m));
    const knockout = matches.filter(m => (m.stage || 'knockout') !== 'group');
    // Championship: the standard knockout. Plate: a second knockout for the pairs who missed it.
    // A plate match fed by plate semi-final losers is the playoff for the place after the plate.
    const mainKnockout = knockout.filter(m => !m.knockout_role || m.knockout_role === 'standard');
    const fedByLosers = new Set(knockout.map(m => m.loser_next_match_id).filter(Boolean));
    const platePlayoffIds = new Set(knockout.filter(m => m.knockout_role === 'plate' && fedByLosers.has(m.id)).map(m => m.id));
    const plate = knockout.filter(m => m.knockout_role === 'plate' && !platePlayoffIds.has(m.id));
    const platePlayoff = knockout.filter(m => platePlayoffIds.has(m.id));
    const totalRounds = new Set(mainKnockout.map(m => m.round)).size;
    const plateRounds = new Set(plate.map(m => m.round)).size;
    const firstRound = Math.min(...mainKnockout.map(m => m.round));
    const mainSize = Number(tournament.knockout_size)
        || mainKnockout.filter(m => m.round === firstRound).flatMap(m => [m.team1_id, m.team2_id]).filter(Boolean).length || 2;
    return { teams, matches, groups, teamsById, playable, knockout, mainKnockout, totalRounds, plate, platePlayoff, platePlayoffIds, plateRounds, mainSize };
}

function tournamentTvMatchSides(match, teamsById) {
    const t1 = match.team1_id ? teamsById[match.team1_id] : null;
    const t2 = match.team2_id ? teamsById[match.team2_id] : null;
    const done = match.is_completed;
    const state = id => (!done || !match.winner_team_id ? '' : match.winner_team_id === id ? 'win' : 'lose');
    const sets = list => (done && Array.isArray(list) && list.length > 1 ? list.join(' ') : '');
    // A one-set match (a fast four, say) reads better as its games, 4–2, than as 1–0.
    const oneSet = done && Array.isArray(match.team1_set_scores) && Array.isArray(match.team2_set_scores)
        && match.team1_set_scores.length === 1 && match.team2_set_scores.length === 1;
    const score = (teamId, total, games) => {
        if (!done) return null;
        if (match.is_walkover) return match.winner_team_id === teamId ? 'W/O' : '';
        return oneSet ? games[0] : total;
    };
    return [
        { team: t1, people: tournamentTvPeople(t1), score: score(match.team1_id, match.team1_score, match.team1_set_scores), sets: sets(match.team1_set_scores), state: state(match.team1_id) },
        { team: t2, people: tournamentTvPeople(t2), score: score(match.team2_id, match.team2_score, match.team2_set_scores), sets: sets(match.team2_set_scores), state: state(match.team2_id) }
    ];
}

function tournamentTvGroupHtml(board, group, index, through) {
    const groupTeams = board.teams.filter(t => t.group_id === group.id);
    const groupMatches = board.matches.filter(m => m.group_id === group.id);
    const standings = tournamentGroupStandings(groupTeams, groupMatches.length ? groupMatches : board.matches.filter(m => m.stage === 'group'));
    const played = groupMatches.filter(m => m.is_completed && m.team1_id && m.team2_id).length;
    const total = groupMatches.filter(m => m.team1_id && m.team2_id).length;
    const rows = standings.map((row, i) => {
        const team = board.teamsById[row.teamId];
        return `<div class="tv-group-row tv-rise${i < through ? ' tv-through' : ''}" style="--i:${index * 6 + i + 1}">
            <div class="tv-rank">${i + 1}</div>
            ${tvPairAvatars(tournamentTvPeople(team))}
            <div class="tv-name">${tvEsc(tournamentTvShortName(team))}</div>
            <div class="tv-num">${row.played}</div>
            <div class="tv-num">${row.setsWon}–${row.setsLost}</div>
            <div class="tv-num">${row.gamesWon - row.gamesLost > 0 ? '+' : ''}${row.gamesWon - row.gamesLost}</div>
            <div class="tv-pill">${row.won}<small>W</small></div>
        </div>`;
    }).join('');
    return `<div class="tv-group">
        <div class="tv-section-title tv-rise" style="--i:${index * 6}">${tvEsc(group.name || 'Group')}<span>${played} of ${total} played</span></div>
        <div class="tv-group-rows" style="--rows:${Math.max(standings.length, 1)}">
            <div class="tv-group-head"><div>#</div><div></div><div>Pair</div><div>P</div><div>Sets</div><div>Games</div><div>Won</div></div>
            ${rows}
        </div>
    </div>`;
}

// At most three rounds fit across a TV: from the earliest round still being
// played, or the last three once it is over. Byes are left out. `path` is
// 'championship' or 'plate'; each gets a banner saying which it is.
function tournamentTvBracketHtml(board, path = 'championship') {
    const isPlate = path === 'plate';
    const list = isPlate ? board.plate : board.mainKnockout;
    const extras = isPlate
        ? board.platePlayoff
        : board.knockout.filter(m => m.knockout_role === 'third_place' || m.knockout_role === 'placement');
    const label = r => (isPlate ? `Plate ${bracketRoundLabel(r, board.plateRounds).toLowerCase()}` : bracketRoundLabel(r, board.totalRounds));
    const allRounds = [...new Set(list.map(m => m.round))].sort((a, b) => a - b);
    const isBye = m => m.is_completed && (!m.team1_id || !m.team2_id);
    const open = list.filter(m => !m.is_completed && m.team1_id && m.team2_id).map(m => m.round);
    const lastStart = Math.max(0, allRounds.length - 3);
    const start = open.length ? Math.min(allRounds.indexOf(Math.min(...open)), lastStart) : lastStart;
    const rounds = allRounds.slice(start, start + 3);
    const shown = r => list.filter(m => m.round === r && !isBye(m));
    const nextId = (list.find(m => !m.is_completed && m.team1_id && m.team2_id) || {}).id;
    const largest = Math.max(1, ...rounds.map(r => shown(r).length));
    const tieScale = largest >= 8 ? 0.6 : largest >= 4 ? 0.9 : 1.2;
    let i = 0;
    const tie = match => {
        const sides = tournamentTvMatchSides(match, board.teamsById);
        const side = s => {
            const name = s.team ? tournamentTvShortName(s.team) : (match.is_completed ? 'Bye' : 'TBD');
            return `<div class="tv-tie-side ${s.state ? 'tv-' + s.state : ''}${s.team ? '' : ' tv-tbd'}">
                ${s.team ? tvPairAvatars(s.people) : ''}
                <div class="tv-tie-name">${tvEsc(name)}</div>
                <div class="tv-tie-score">${s.score == null ? '' : tvEsc(s.score)}</div>
            </div>`;
        };
        return `<div class="tv-tie tv-rise${match.id === nextId ? ' tv-tie-next' : ''}" style="--i:${i++};--tie-s:${tieScale}">${side(sides[0])}${side(sides[1])}</div>`;
    };
    const columns = rounds.map(r => `<div class="tv-round"><div class="tv-round-title">${tvEsc(label(r))}</div>
            <div class="tv-round-matches">${shown(r).map(tie).join('')}</div></div>`);
    if (extras.length && rounds.includes(allRounds[allRounds.length - 1])) {
        columns.push(`<div class="tv-round"><div class="tv-round-title">${tvEsc(tournamentTvRoundTitle(extras[0], board))}</div>
            <div class="tv-round-matches">${extras.map(tie).join('')}</div></div>`);
    }
    const hasPlate = board.plate.length > 0;
    const banner = isPlate
        ? `<div class="tv-path tv-rise"><i class="fas fa-medal"></i><span class="tv-path-name">Plate</span><span class="tv-path-note">For the pairs who missed the championship · the winners finish ${tvEsc(tvOrdinal(board.mainSize + 1))}</span></div>`
        : (hasPlate ? `<div class="tv-path tv-rise"><i class="fas fa-trophy"></i><span class="tv-path-name">Championship</span><span class="tv-path-note">The winners take the title</span></div>` : '');
    return `<div class="tv-bracket-wrap${isPlate ? ' tv-plate' : ''}">${banner}
        <div class="tv-bracket" style="--cols:${Math.max(columns.length, 1)}">${columns.join('')}</div></div>`;
}

function tournamentTvPages(tournament = tournamentTvCurrent(), store = tournamentTvStore()) {
    if (!tournament) return [];
    const pages = tournamentTvPageList(tournament, tournamentTvBoard(tournament, store));
    pages.forEach(page => { page.header = () => tournamentTvHeader(tournament, store); });
    return pages;
}

function tournamentTvPageList(tournament, board) {
    const pages = [];
    const idsOf = teams => teams.flatMap(t => tournamentTvPeople(t).map(p => p.id));

    if (!board.matches.length) {
        return [{ key: 'empty', label: tournament.name, now: 'Draw', ids: [], html: () => '<div class="tv-empty">The draw has not been made yet.</div>' }];
    }

    const champion = getChampion(tournament, board.teams, board.matches);
    if (champion && tournament.status === 'completed') {
        const final = board.mainKnockout.find(m => m.is_completed && m.winner_team_id === champion.id && m.round === Math.max(...board.mainKnockout.map(x => x.round)));
        const runnerUpId = final ? (final.team1_id === champion.id ? final.team2_id : final.team1_id) : null;
        const runnerUp = runnerUpId ? board.teamsById[runnerUpId] : null;
        const plateFinal = board.plate.find(m => !m.next_match_id && m.is_completed && m.winner_team_id);
        const plateWinner = plateFinal ? board.teamsById[plateFinal.winner_team_id] : null;
        pages.push({
            key: 'champion', label: 'Champions', now: 'Champions', ids: idsOf([champion]),
            html: () => `<div class="tv-champion">
                <div class="tv-champion-label tv-rise"><i class="fas fa-trophy me-3"></i>${tvEsc(tournament.champion_label || 'Champions')}</div>
                <div class="tv-pop" style="--i:1">${tvPairAvatars(tournamentTvPeople(champion), 'tv-ring-1')}</div>
                <div class="tv-champion-name tv-rise" style="--i:4">${tvEsc(tournamentSideName(champion))}</div>
                ${runnerUp ? `<div class="tv-champion-sub tv-rise" style="--i:6">Runners-up · ${tvEsc(tournamentSideName(runnerUp))}</div>` : ''}
                ${plateWinner ? `<div class="tv-champion-plate tv-rise" style="--i:8"><i class="fas fa-medal"></i>Plate winners · ${tvEsc(tournamentSideName(plateWinner))}</div>` : ''}
            </div>`
        });
    }

    // Matches waiting to be played, in draw order: what is on now or next.
    const open = board.playable.filter(m => !m.is_completed);
    const isGroupStage = tournament.phase === 'group_stage';
    const upNext = open.slice(0, Math.max(Number(tournament.courts_in_use) || 0, 4)).slice(0, 6);
    if (tournament.status === 'active' && upNext.length) {
        const title = m => ((m.stage || 'knockout') === 'group'
            ? ((board.groups.find(g => g.id === m.group_id) || {}).name || 'Group')
            : tournamentTvRoundTitle(m, board));
        pages.push({
            key: 'next', label: 'On court', now: 'On court now',
            ids: upNext.flatMap(m => [m.team1_id, m.team2_id]).map(id => board.teamsById[id]).filter(Boolean).flatMap(t => tournamentTvPeople(t).map(p => p.id)),
            html: () => tvCourtsHtml(upNext.map((m, i) => {
                const sides = tournamentTvMatchSides(m, board.teamsById);
                return tvCourtCard(i, title(m), i < (Number(tournament.courts_in_use) || upNext.length) ? 'Now' : 'Next', i < (Number(tournament.courts_in_use) || upNext.length), false, sides, tournamentTvCardClass(m));
            }))
        });
    }

    // Latest results, newest first.
    const results = board.playable.filter(m => m.is_completed)
        .sort((a, b) => String(b.completed_date || b.updated_at || '').localeCompare(String(a.completed_date || a.updated_at || '')))
        .slice(0, 4);
    if (tournament.status === 'active' && results.length) {
        const title = m => ((m.stage || 'knockout') === 'group'
            ? ((board.groups.find(g => g.id === m.group_id) || {}).name || 'Group')
            : tournamentTvRoundTitle(m, board));
        pages.push({
            key: 'results', label: 'Latest results', now: 'Latest results',
            ids: results.flatMap(m => [m.team1_id, m.team2_id]).map(id => board.teamsById[id]).filter(Boolean).flatMap(t => tournamentTvPeople(t).map(p => p.id)),
            html: () => tvCourtsHtml(results.map((m, i) => tvCourtCard(i, title(m), 'Final', false, true, tournamentTvMatchSides(m, board.teamsById), tournamentTvCardClass(m))))
        });
    }

    // Groups, two to a page.
    const through = Number(tournament.advance_per_group) || 0;
    const groups = board.groups.filter(g => board.teams.filter(t => t.group_id === g.id).length >= 2);
    for (let i = 0; i < groups.length; i += 2) {
        const pair = groups.slice(i, i + 2);
        const label = pair.map(g => g.name || 'Group').join(' & ');
        pages.push({
            key: 'g' + i, label, now: pair.length > 1 ? 'Group tables' : (pair[0].name || 'Group'),
            ids: idsOf(board.teams.filter(t => pair.some(g => g.id === t.group_id))),
            html: () => `<div class="tv-groups" style="--cols:${pair.length}">${pair.map((g, n) => tournamentTvGroupHtml(board, g, n, through)).join('')}</div>`
        });
    }

    if (board.mainKnockout.length && (!isGroupStage || tournament.status === 'completed')) {
        const hasPlate = board.plate.length > 0;
        pages.push({ key: 'bracket', label: hasPlate ? 'Championship' : 'Knockout', now: hasPlate ? 'Championship' : 'Knockout', ids: idsOf(board.teams), html: () => tournamentTvBracketHtml(board, 'championship') });
        if (hasPlate) {
            pages.push({ key: 'plate', label: 'Plate', now: 'Plate', ids: idsOf(board.teams), html: () => tournamentTvBracketHtml(board, 'plate') });
        }
    }

    if (!pages.length) {
        pages.push({ key: 'results', label: 'Results', now: 'Results', ids: idsOf(board.teams), html: () => tvCourtsHtml(board.playable.slice(-6).map((m, i) => tvCourtCard(i, tournamentTvRoundTitle(m, board), m.is_completed ? 'Final' : '', false, m.is_completed, tournamentTvMatchSides(m, board.teamsById), tournamentTvCardClass(m)))) });
    }
    return pages;
}

function tournamentTvHeader(tournament, store = tournamentTvStore()) {
    if (!tournament) return {};
    const board = tournamentTvBoard(tournament, store);
    const played = board.playable.filter(m => m.is_completed).length;
    const total = board.playable.length;
    const stage = tournament.status === 'completed' || tournament.phase === 'completed' ? 'Completed'
        : tournament.phase === 'group_stage' ? 'Groups'
        : tournament.phase === 'knockout' ? 'Knockout' : 'Setup';
    let detail;
    if (stage === 'Groups') {
        const left = board.playable.filter(m => !m.is_completed && (m.stage || 'knockout') === 'group').length;
        detail = left ? `${left} group ${left === 1 ? 'match' : 'matches'} to play` : 'Groups done · knockout next';
    } else if (stage === 'Knockout') {
        const titles = [];
        board.knockout.filter(m => !m.is_completed).forEach(m => {
            const t = tournamentTvRoundTitle(m, board);
            if (!titles.includes(t)) titles.push(t);
        });
        // Same wording as the app: "Semifinals, final and third place to play".
        const spoken = titles.map((t, n) => (n === 0 ? t : t.toLowerCase()));
        const list = spoken.length > 1 ? `${spoken.slice(0, -1).join(', ')} and ${spoken[spoken.length - 1]}` : spoken[0];
        detail = titles.length ? `${list} to play` : 'Final played';
    } else if (stage === 'Completed') {
        const champion = getChampion(tournament, board.teams, board.matches);
        detail = champion ? `Winners · ${tournamentSideName(champion)}` : 'Finished';
    } else {
        detail = 'Draw not made yet';
    }
    if (tournament.delay_note) detail += ` · ${tournament.delay_note}`;
    return {
        title: tournament.name,
        stage,
        live: tournament.status === 'active',
        detail: total ? `${detail} · ${played} of ${total} played` : detail,
        progress: total && stage !== 'Completed' ? played / total : null
    };
}

const tournamentTv = new TvScreen({
    id: 'tournamentFullscreenOverlay',
    ariaLabel: 'Tournament on TV',
    rotateMs: TOURNAMENT_FS_ROTATE_MS,
    pages: () => tournamentTvPages(),
    header: () => tournamentTvHeader(tournamentTvCurrent()),
    onClose: () => {
        if (!document.getElementById('bracketModal')?.classList.contains('show')) {
            if (typeof stopTournamentPolling === 'function') stopTournamentPolling();
            tournamentDetailId = null;
        }
    }
});

function openTournamentFullscreen() {
    if (!tournamentDetailId) return;
    tournamentTv.open();
    if (typeof maybeStartTournamentPolling === 'function') maybeStartTournamentPolling(true);
}

function closeTournamentFullscreen() {
    tournamentTv.close();
}

// Called by refreshOpenTournament on every poll.
function renderTournamentFullscreen() {
    tournamentTv.refresh();
}

// ── Box league ────────────────────────────────────────────────

const BOX_LEAGUE_TV_ROTATE_MS = 10000;
const BOX_LEAGUE_TV_REFRESH_MS = 60000;

// Active leagues at the player's home club: [{ league, boxes: [{ box, teams, matches }] }]
let boxLeagueTvData = { leagues: [], loaded: false, noClub: false };
let boxLeagueTvTimer = null;

async function boxLeagueTvLoad() {
    const client = tvSupabase();
    const clubId = typeof resolveAmericanoClubId === 'function' ? await resolveAmericanoClubId() : null;
    if (!client || !clubId) {
        boxLeagueTvData = { leagues: [], loaded: true, noClub: !clubId };
        return;
    }
    const { data: leagues, error } = await client.from('box_leagues').select('*')
        .eq('club_id', clubId).eq('status', 'active').order('created_at', { ascending: true });
    if (error) throw error;
    const leagueIds = (leagues || []).map(l => l.id);
    if (!leagueIds.length) {
        boxLeagueTvData = { leagues: [], loaded: true, noClub: false };
        return;
    }
    const { data: boxes } = await client.from('box_league_boxes').select('*').in('league_id', leagueIds);
    const boxIds = (boxes || []).map(b => b.id);
    const [{ data: teams }, { data: matches }] = boxIds.length
        ? await Promise.all([
            client.from('box_league_teams').select('*').in('box_id', boxIds),
            client.from('box_league_matches').select('*').in('box_id', boxIds)
        ])
        : [{ data: [] }, { data: [] }];
    boxLeagueTvData = {
        loaded: true,
        noClub: false,
        leagues: leagues.map(league => ({
            league,
            boxes: (boxes || []).filter(b => b.league_id === league.id)
                .sort((a, b) => (a.position || 0) - (b.position || 0))
                .map(box => ({
                    box,
                    teams: (teams || []).filter(t => t.box_id === box.id),
                    matches: (matches || []).filter(m => m.box_id === box.id)
                }))
        }))
    };
}

// Same table points as the app (BoxLeaguePoints): 2–0 is 5–1, 2–1 is 4–2, a walkover 4–0.
function boxTvSetsWon(a, b) {
    let s1 = 0, s2 = 0;
    for (let i = 0; i < Math.min(a.length, b.length); i++) {
        if (s1 === 2 || s2 === 2) break;
        if (a[i] > b[i]) s1++; else if (b[i] > a[i]) s2++;
    }
    return [s1, s2];
}

function boxTvAward(m) {
    if (!m.is_completed) return null;
    const s1 = m.team1_score || 0, s2 = m.team2_score || 0;
    if (m.is_walkover) return s1 > s2 ? [4, 0] : s2 > s1 ? [0, 4] : [0, 0];
    const a = m.team1_set_scores, b = m.team2_set_scores;
    if (!Array.isArray(a) || !Array.isArray(b) || !a.length || !b.length) {
        return s1 > s2 ? [4, 1] : s2 > s1 ? [1, 4] : null;
    }
    const key = boxTvSetsWon(a, b).join('-');
    return { '2-0': [5, 1], '2-1': [4, 2], '1-2': [2, 4], '0-2': [1, 5] }[key] || null;
}

function boxTvWinner(m) {
    if (!m.is_completed) return null;
    return (m.team1_score || 0) > (m.team2_score || 0) ? m.team1_id : m.team2_id;
}

// The app's box table order (BoxLeaguePoints.sorted): points; then, among pairs
// level on points, points, set difference and game difference in the matches
// between them; then set difference, then game difference; then name.
function boxTvStandings(teams, matches) {
    const done = matches.filter(m => m.is_completed);
    const sideOf = (m, id) => (m.team1_id === id ? 0 : m.team2_id === id ? 1 : -1);
    const points = (id, list) => list.reduce((sum, m) => {
        const side = sideOf(m, id);
        const award = side < 0 ? null : boxTvAward(m);
        return award ? sum + award[side] : sum;
    }, 0);
    const setDiff = (id, list) => list.reduce((sum, m) => {
        const side = sideOf(m, id);
        if (side < 0 || !Array.isArray(m.team1_set_scores) || !Array.isArray(m.team2_set_scores)) return sum;
        const sets = boxTvSetsWon(m.team1_set_scores, m.team2_set_scores);
        return sum + sets[side] - sets[1 - side];
    }, 0);
    const games = list => (Array.isArray(list) ? list.reduce((s, n) => s + (Number(n) || 0), 0) : 0);
    const gameDiff = (id, list) => list.reduce((sum, m) => {
        const side = sideOf(m, id);
        if (side < 0) return sum;
        const own = games(side === 0 ? m.team1_set_scores : m.team2_set_scores);
        const other = games(side === 0 ? m.team2_set_scores : m.team1_set_scores);
        return sum + own - other;
    }, 0);
    const rows = teams.map(team => {
        const row = { team, points: points(team.id, done), played: 0, won: 0, setsWon: 0, setsLost: 0 };
        done.forEach(m => {
            const side = sideOf(m, team.id);
            if (side < 0) return;
            row.played += 1;
            if (boxTvWinner(m) === team.id) row.won += 1;
            if (Array.isArray(m.team1_set_scores) && Array.isArray(m.team2_set_scores)) {
                const sets = boxTvSetsWon(m.team1_set_scores, m.team2_set_scores);
                row.setsWon += sets[side];
                row.setsLost += sets[1 - side];
            }
        });
        return row;
    });
    rows.forEach(row => {
        const level = new Set(rows.filter(r => r.points === row.points).map(r => r.team.id));
        const among = done.filter(m => level.has(m.team1_id) && level.has(m.team2_id));
        const t = row.team;
        row.key = [
            row.points,
            points(t.id, among),
            setDiff(t.id, among),
            gameDiff(t.id, among),
            setDiff(t.id, done),
            gameDiff(t.id, done)
        ];
        row.name = t.player2_name ? `${t.player1_name || ''} & ${t.player2_name}` : (t.player1_name || '');
    });
    return rows.sort((x, y) => {
        for (let i = 0; i < x.key.length; i++) {
            if (x.key[i] !== y.key[i]) return y.key[i] - x.key[i];
        }
        return x.name < y.name ? -1 : x.name > y.name ? 1 : 0;
    });
}

function boxTvPeople(team) {
    if (!team) return [];
    const people = [{ name: (team.player1_name || '').trim() || 'Player', id: team.player1_id || null }];
    if ((team.player2_name || '').trim()) people.push({ name: team.player2_name.trim(), id: team.player2_id || null });
    return people;
}

function boxTvShortName(team) {
    const first = n => (n || '').trim().split(/\s+/)[0] || '';
    if (!team) return 'TBD';
    return team.player2_name ? `${first(team.player1_name)} & ${first(team.player2_name)}` : (team.player1_name || 'Player');
}

// "Mon 26 Oct · 6.45pm"
function boxTvWhen(iso) {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return '';
    const day = d.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' });
    let h = d.getHours();
    const m = d.getMinutes();
    const ampm = h >= 12 ? 'pm' : 'am';
    h = h % 12 || 12;
    return `${day} · ${h}${m ? '.' + String(m).padStart(2, '0') : ''}${ampm}`;
}

function boxTvPageHtml(entry, boxIndex, boxCount, moves) {
    const { teams, matches } = entry;
    const rows = boxTvStandings(teams, matches);
    const up = boxIndex > 0 ? moves : 0;
    const down = boxIndex < boxCount - 1 ? moves : 0;
    const singles = teams.length > 0 && teams.every(t => !t.player2_name);
    const table = rows.map((r, i) => {
        const zone = i < up ? ' tv-up' : (i >= rows.length - down ? ' tv-down' : '');
        const lead = i === 0 && r.played > 0 ? ' tv-top-1' : '';
        const arrow = zone === ' tv-up' ? '<i class="fas fa-caret-up"></i>' : zone === ' tv-down' ? '<i class="fas fa-caret-down"></i>' : '';
        return `<div class="tv-box-row tv-rise${zone}${lead}" style="--i:${i}">
            <div class="tv-rank">${i + 1}${arrow}</div>
            ${tvPairAvatars(boxTvPeople(r.team), lead ? 'tv-ring-1' : '')}
            <div class="tv-box-names">${boxTvPeople(r.team).map(p => `<div>${tvEsc(p.name)}</div>`).join('')}</div>
            <div class="tv-num">${r.played}</div>
            <div class="tv-num">${r.won}</div>
            <div class="tv-num">${r.setsWon}–${r.setsLost}</div>
            <div class="tv-pill">${r.points}</div>
        </div>`;
    }).join('');

    // Every pairing in the box: booked first, then results, then still to play.
    const pairings = [];
    for (let a = 0; a < teams.length; a++) {
        for (let b = a + 1; b < teams.length; b++) {
            const t1 = teams[a], t2 = teams[b];
            const m = matches.find(x => (x.team1_id === t1.id && x.team2_id === t2.id) || (x.team1_id === t2.id && x.team2_id === t1.id));
            pairings.push(m ? { m, t1: teams.find(t => t.id === m.team1_id), t2: teams.find(t => t.id === m.team2_id) } : { m: null, t1, t2 });
        }
    }
    const rank = p => (p.m?.is_completed ? 1 : p.m?.scheduled_date ? 0 : 2);
    pairings.sort((x, y) => rank(x) - rank(y)
        || (rank(x) === 0 ? String(x.m.scheduled_date).localeCompare(String(y.m.scheduled_date)) : 0)
        || (rank(x) === 1 ? String(y.m.completed_date || '').localeCompare(String(x.m.completed_date || '')) : 0));
    // Six fit on a TV; a box of five has ten pairings, so the rest become a count.
    const shownPairs = pairings.slice(0, 6);
    const hidden = pairings.length - shownPairs.length;
    const fixtures = shownPairs.map(({ m, t1, t2 }, i) => {
        const w = m ? boxTvWinner(m) : null;
        const side = (team, sets) => `<div class="tv-fx-side${w ? (w === team.id ? ' tv-win' : ' tv-lose') : ''}">
            ${tvPairAvatars(boxTvPeople(team))}
            <div class="tv-fx-name">${tvEsc(boxTvShortName(team))}</div>
            ${sets != null ? `<div class="tv-fx-sets">${tvEsc(sets)}</div>` : ''}
        </div>`;
        let status = '';
        let s1 = null, s2 = null;
        if (m?.is_completed) {
            if (m.is_walkover) { s1 = w === t1.id ? 'W/O' : ''; s2 = w === t2.id ? 'W/O' : ''; }
            else if (Array.isArray(m.team1_set_scores) && Array.isArray(m.team2_set_scores)) { s1 = m.team1_set_scores.join(' '); s2 = m.team2_set_scores.join(' '); }
            else { s1 = String(m.team1_score ?? ''); s2 = String(m.team2_score ?? ''); }
        } else if (m?.scheduled_date) {
            status = `<div class="tv-fx-chip tv-fx-booked"><i class="fas fa-calendar-check"></i>${tvEsc(boxTvWhen(m.scheduled_date))}</div>`;
        } else {
            status = '<div class="tv-fx-chip">To play</div>';
        }
        return `<div class="tv-fixture tv-rise${m?.is_completed ? ' tv-fx-done' : ''}" style="--i:${rows.length + i}">
            <div class="tv-fx-sides">${side(t1, s1)}${side(t2, s2)}</div>${status}</div>`;
    }).join('');
    const played = matches.filter(m => m.is_completed).length;
    const scale = shownPairs.length > 4 ? 0.68 : 1;
    return `<div class="tv-box">
        <div class="tv-box-table" style="--rows:${Math.max(rows.length, 1)}">
            <div class="tv-box-head"><div>#</div><div></div><div>${singles ? 'Player' : 'Pair'}</div><div>P</div><div>W</div><div>Sets</div><div>Pts</div></div>
            ${table || '<div class="tv-empty">No pairs yet</div>'}
        </div>
        <div class="tv-box-side" style="--fx:${scale}">
            <div class="tv-side-title">Matches<span>${played} of ${pairings.length} played</span></div>
            <div class="tv-fixtures">${fixtures}</div>
            ${hidden ? `<div class="tv-fx-more">+${hidden} more ${hidden === 1 ? 'match' : 'matches'} to play</div>` : ''}
        </div>
    </div>`;
}

function boxLeagueTvPages() {
    if (!boxLeagueTvData.loaded) return [{ key: 'loading', label: '', now: '', ids: [], html: () => '<div class="tv-empty">Loading leagues…</div>' }];
    if (boxLeagueTvData.noClub) return [{ key: 'noclub', label: '', now: '', ids: [], html: () => '<div class="tv-empty">Choose your club under Profile in the PadelPals app to show its box leagues.</div>' }];
    const clubName = window.currentUserClubData?.club_name || '';
    const pages = [];
    boxLeagueTvData.leagues.forEach(({ league, boxes }) => {
        const group = clubName && league.name.startsWith(clubName + ' ') ? league.name.slice(clubName.length + 1) : league.name;
        const withTeams = boxes.filter(b => b.teams.length);
        withTeams.forEach((entry, i) => {
            const page = {
                key: entry.box.id,
                group,
                label: entry.box.name || `Box ${i + 1}`,
                now: entry.box.name || `Box ${i + 1}`,
                ms: BOX_LEAGUE_TV_ROTATE_MS,
                league,
                entry,
                ids: entry.teams.flatMap(t => boxTvPeople(t).map(p => p.id)),
                html: () => boxTvPageHtml(entry, i, withTeams.length, Number(league.teams_to_move_per_box) || 0)
            };
            page.header = () => boxLeagueTvHeader(page);
            pages.push(page);
        });
    });
    if (!pages.length) return [{ key: 'none', label: '', now: '', ids: [], html: () => '<div class="tv-empty">No active box leagues at your club right now.</div>' }];
    return pages;
}

function boxLeagueTvHeader(page) {
    const club = window.currentUserClubData?.club_name;
    if (!page?.league) return { title: club ? `${club} box leagues` : 'Box leagues', stage: 'Box league', detail: '' };
    const { league, entry } = page;
    const n = entry.teams.length;
    const required = n * (n - 1) / 2;
    const played = entry.matches.filter(m => m.is_completed).length;
    const ends = league.end_date ? new Date(league.end_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }) : '';
    const moves = Number(league.teams_to_move_per_box) || 0;
    const side = entry.teams.every(t => !t.player2_name) ? (moves === 1 ? 'player' : 'players') : (moves === 1 ? 'pair' : 'pairs');
    return {
        title: league.name,
        stage: page.now,
        live: false,
        detail: [`${played} of ${required} played`, ends && `ends ${ends}`, moves && `${moves} ${side} up and down`].filter(Boolean).join(' · '),
        progress: required ? played / required : null
    };
}

const boxLeagueTv = new TvScreen({
    id: 'boxLeagueFullscreenOverlay',
    ariaLabel: 'Box leagues on TV',
    rotateMs: BOX_LEAGUE_TV_ROTATE_MS,
    pages: boxLeagueTvPages,
    header: () => boxLeagueTvHeader(boxLeagueTv.pages[boxLeagueTv.index]),
    onClose: () => {
        clearInterval(boxLeagueTvTimer);
        boxLeagueTvTimer = null;
    }
});

async function openBoxLeagueFullscreen() {
    boxLeagueTvData = { leagues: [], loaded: false, noClub: false };
    boxLeagueTv.open();
    try {
        await boxLeagueTvLoad();
    } catch (err) {
        console.error('boxLeagueTvLoad', err);
        boxLeagueTvData = { leagues: [], loaded: true, noClub: false };
    }
    boxLeagueTv.goTo(0);
    clearInterval(boxLeagueTvTimer);
    boxLeagueTvTimer = setInterval(async () => {
        if (document.hidden || !boxLeagueTv.isOpen) return;
        try { await boxLeagueTvLoad(); boxLeagueTv.refresh(); } catch (err) { console.warn('boxLeagueTvLoad', err); }
    }, BOX_LEAGUE_TV_REFRESH_MS);
}

function closeBoxLeagueFullscreen() {
    boxLeagueTv.close();
}

// ── On court ──────────────────────────────────────────────────
//
// Ordinary club matches and box league fixtures: what is on court right now,
// and what starts within the next few hours, grouped by start time.

const ON_COURT_AHEAD_HOURS = 3;
const ON_COURT_DEFAULT_MINUTES = 90;

let onCourtMatches = []; // { id, start, end, court, order, note, sides: [[people], [people]], done, scores }

// "5.15pm"
function tvTime(date) {
    let h = date.getHours();
    const m = date.getMinutes();
    const ampm = h >= 12 ? 'pm' : 'am';
    h = h % 12 || 12;
    return `${h}${m ? '.' + String(m).padStart(2, '0') : ''}${ampm}`;
}

// Names and ids side by side, padded with open places up to a pair.
function onCourtSide(names, ids, size) {
    const people = (names || []).map((name, i) => ({ name: name || 'Player', id: (ids || [])[i] || null }));
    while (people.length < size) people.push({ name: 'Open place', id: null, open: true });
    return people;
}

async function onCourtLoad() {
    const client = tvSupabase();
    const clubId = await clubTvClubId();
    if (!client || !clubId) { onCourtMatches = []; return; }
    const now = Date.now();
    const from = new Date(now - 4 * 3600 * 1000).toISOString();
    const to = new Date(now + ON_COURT_AHEAD_HOURS * 3600 * 1000).toISOString();

    const [{ data: matches, error }, { data: courts }, { data: leagues }] = await Promise.all([
        client.from('matches')
            .select('id, date, duration, court_id, status, team1_players, team2_players, team1_player_ids, team2_player_ids, team1_set_scores, team2_set_scores, team1_sets_won, team2_sets_won')
            .eq('club_id', clubId).in('status', ['PENDING', 'COMPLETED'])
            .gte('date', from).lte('date', to),
        client.from('club_courts').select('id, name, sort_order').eq('club_id', clubId),
        client.from('box_leagues').select('id, name').eq('club_id', clubId).eq('status', 'active')
    ]);
    if (error) throw error;
    const courtById = {};
    (courts || []).forEach(c => { courtById[c.id] = c; });
    const items = [];

    (matches || []).forEach(m => {
        const start = new Date(m.date);
        const size = Math.max(2, (m.team1_players || []).length, (m.team2_players || []).length);
        const court = courtById[m.court_id];
        items.push({
            id: m.id,
            start,
            end: new Date(start.getTime() + (Number(m.duration) || ON_COURT_DEFAULT_MINUTES) * 60000),
            court: court?.name || '',
            order: court?.sort_order ?? 99,
            note: '',
            sides: [onCourtSide(m.team1_players, m.team1_player_ids, size), onCourtSide(m.team2_players, m.team2_player_ids, size)],
            done: m.status === 'COMPLETED',
            scores: m.status === 'COMPLETED' ? [m.team1_sets_won, m.team2_sets_won] : null
        });
    });

    // Box league fixtures booked in the same window.
    const leagueIds = (leagues || []).map(l => l.id);
    if (leagueIds.length) {
        const { data: boxes } = await client.from('box_league_boxes').select('id, name, league_id').in('league_id', leagueIds);
        const boxIds = (boxes || []).map(b => b.id);
        const { data: fixtures } = boxIds.length
            ? await client.from('box_league_matches')
                .select('id, box_id, team1_id, team2_id, scheduled_date, duration, court_booking_id, is_completed, team1_score, team2_score')
                .in('box_id', boxIds).gte('scheduled_date', from).lte('scheduled_date', to)
            : { data: [] };
        if ((fixtures || []).length) {
            const teamIds = [...new Set(fixtures.flatMap(f => [f.team1_id, f.team2_id]).filter(Boolean))];
            const bookingIds = fixtures.map(f => f.court_booking_id).filter(Boolean);
            const [{ data: teams }, { data: bookings }] = await Promise.all([
                client.from('box_league_teams').select('id, player1_id, player1_name, player2_id, player2_name').in('id', teamIds),
                // Members can only read their own bookings, so the court may be unknown.
                bookingIds.length ? client.from('court_bookings').select('id, court_id').in('id', bookingIds) : Promise.resolve({ data: [] })
            ]);
            const teamById = {};
            (teams || []).forEach(t => { teamById[t.id] = t; });
            const courtByBooking = {};
            (bookings || []).forEach(b => { courtByBooking[b.id] = courtById[b.court_id]; });
            const boxById = {};
            (boxes || []).forEach(b => { boxById[b.id] = b; });
            const leagueById = {};
            (leagues || []).forEach(l => { leagueById[l.id] = l; });
            const clubName = window.currentUserClubData?.club_name || '';
            fixtures.forEach(f => {
                const start = new Date(f.scheduled_date);
                const box = boxById[f.box_id];
                const league = box ? leagueById[box.league_id] : null;
                const leagueName = league ? (clubName && league.name.startsWith(clubName + ' ') ? league.name.slice(clubName.length + 1) : league.name) : 'Box league';
                const court = courtByBooking[f.court_booking_id];
                items.push({
                    id: f.id,
                    start,
                    end: new Date(start.getTime() + (Number(f.duration) || ON_COURT_DEFAULT_MINUTES) * 60000),
                    court: court?.name || '',
                    order: court?.sort_order ?? 99,
                    note: `Box league · ${leagueName}${box?.name ? ' · ' + box.name : ''}`,
                    sides: [boxTvPeople(teamById[f.team1_id]), boxTvPeople(teamById[f.team2_id])],
                    done: !!f.is_completed,
                    scores: f.is_completed ? [f.team1_score, f.team2_score] : null
                });
            });
        }
    }
    onCourtMatches = items;
}

function onCourtCards(list, live) {
    return tvCourtsHtml(list.map((item, i) => {
        const won = item.scores && item.scores[0] !== item.scores[1] ? (item.scores[0] > item.scores[1] ? 0 : 1) : -1;
        const sides = item.sides.map((people, n) => ({
            people,
            score: item.scores ? item.scores[n] : null,
            state: won < 0 ? '' : (won === n ? 'win' : 'lose')
        }));
        const chip = item.done ? 'Final' : (live ? `Until ${tvTime(item.end)}` : `${tvTime(item.start)}–${tvTime(item.end)}`);
        return tvCourtCard(i, item.court || 'Court to be confirmed', chip, live && !item.done, item.done, sides, '', item.note);
    }));
}

function onCourtPages() {
    const now = new Date();
    const limit = new Date(now.getTime() + ON_COURT_AHEAD_HOURS * 3600 * 1000);
    const byCourt = (a, b) => a.order - b.order || String(a.court).localeCompare(String(b.court));
    const live = onCourtMatches.filter(m => m.start <= now && m.end > now).sort(byCourt);
    const upcoming = onCourtMatches.filter(m => m.start > now && m.start <= limit).sort((a, b) => a.start - b.start || byCourt(a, b));
    const slots = [];
    upcoming.forEach(m => {
        const last = slots[slots.length - 1];
        if (last && last.start.getTime() === m.start.getTime()) last.matches.push(m);
        else slots.push({ start: m.start, matches: [m] });
    });
    const idsOf = list => list.flatMap(m => m.sides.flat().map(p => p.id));
    const header = (stage, isLive, detail) => () => ({ title: 'On court', stage, live: isLive, detail });
    const nextLine = slots.length ? `next start ${tvTime(slots[0].start)}` : `nothing else in the next ${ON_COURT_AHEAD_HOURS} hours`;
    const pages = [];
    if (live.length) {
        pages.push({
            key: 'now', label: 'Now', now: 'Playing now', ids: idsOf(live),
            header: header('Now', true, `${live.length} ${live.length === 1 ? 'match' : 'matches'} on court · ${nextLine}`),
            html: () => onCourtCards(live, true)
        });
    }
    slots.forEach((slot, n) => {
        const time = tvTime(slot.start);
        const count = slot.matches.length;
        pages.push({
            key: 'at' + slot.start.getTime(), label: time, now: n === 0 ? `Up next · ${time}` : `Later · ${time}`, ids: idsOf(slot.matches),
            header: header(n === 0 ? 'Up next' : 'Later', false, `${count} ${count === 1 ? 'match' : 'matches'} starting at ${time}`),
            html: () => onCourtCards(slot.matches, false)
        });
    });
    return pages;
}

// ── Performance of the week ───────────────────────────────────
//
// The app's "Performance of the night" (SocialPerformance.swift): on a published
// club social, the winning pair with the lowest pre-match win probability.
// It appears from London midnight after the night and stays for a week.
// Same rules as the app for which results count and how the forecast works.

const PERFORMANCE_SHOW_DAYS = 7;
const WIN_PROBABILITY_SCALE = 1.4;

let performanceNights = []; // [{ session, formatName, picks, unscored }]

// Midnight in London on a 'YYYY-MM-DD' day, as a Date.
function tvLondonMidnight(ymd, addDays = 0) {
    const [y, m, d] = ymd.split('-').map(Number);
    const utc = Date.UTC(y, m - 1, d + addDays);
    const hour = Number(new Intl.DateTimeFormat('en-GB', { timeZone: 'Europe/London', hour: 'numeric', hourCycle: 'h23' }).format(new Date(utc)));
    return new Date(utc - hour * 3600 * 1000);
}

function tvYmd(date) {
    return new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/London' }).format(date);
}

function performanceFirstNames(names) {
    const firsts = names.map(n => String(n || '').trim().split(/\s+/)[0]).filter(Boolean);
    if (!firsts.length) return 'The pair';
    if (firsts.length === 1) return firsts[0];
    return `${firsts.slice(0, -1).join(', ')} and ${firsts[firsts.length - 1]}`;
}

// Winners' games first, e.g. "6–4, 6–3". Falls back to sets, "2–0".
function performanceScore(winnerSets, loserSets, won, lost) {
    const parts = [];
    for (let i = 0; i < Math.max(winnerSets.length, loserSets.length); i++) {
        const a = winnerSets[i] || 0, b = loserSets[i] || 0;
        if (a || b) parts.push(`${a}–${b}`);
    }
    return parts.length ? parts.join(', ') : `${won}–${lost}`;
}

const TV_UUID_ANY = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// One social night: every result that belongs to it, then the least likely win.
async function performanceNight(client, session) {
    const id = session.id;
    const [{ data: assignments }, { data: availability }, { data: fixtures }] = await Promise.all([
        client.from('session_assignments').select('user_id, match_id').eq('session_id', id),
        client.from('session_availability').select('user_id').eq('session_id', id),
        client.from('session_court_fixtures').select('team1_player1_id, team1_player2_id, team2_player1_id, team2_player2_id, box_league_match_id').eq('session_id', id)
    ]);
    const lower = v => String(v || '').trim().toLowerCase();
    const people = new Set();
    (assignments || []).forEach(a => a.user_id && people.add(lower(a.user_id)));
    (availability || []).forEach(a => a.user_id && people.add(lower(a.user_id)));
    (fixtures || []).forEach(f => ['team1_player1_id', 'team1_player2_id', 'team2_player1_id', 'team2_player2_id']
        .forEach(k => f[k] && people.add(lower(f[k]))));
    const linkedMatchIds = new Set((assignments || []).map(a => lower(a.match_id)).filter(Boolean));
    const linkedBoxIds = new Set((fixtures || []).map(f => lower(f.box_league_match_id)).filter(Boolean));
    const linked = new Set([...linkedMatchIds, ...linkedBoxIds]);
    const start = tvLondonMidnight(session.play_date);
    const end = new Date(start.getTime() + 30 * 3600 * 1000);

    const matchCols = 'id, date, status, team1_players, team2_players, team1_player_ids, team2_player_ids, team1_set_scores, team2_set_scores, team1_sets_won, team2_sets_won';
    const peopleList = [...people].filter(p => TV_UUID_ANY.test(p));
    const [{ data: linkedMatches }, { data: dayMatches }, { data: linkedBoxes }, { data: teams }] = await Promise.all([
        linkedMatchIds.size ? client.from('matches').select(matchCols).in('id', [...linkedMatchIds]) : Promise.resolve({ data: [] }),
        client.from('matches').select(matchCols).eq('club_id', session.club_id).gte('date', start.toISOString()).lt('date', end.toISOString()),
        linkedBoxIds.size ? client.from('box_league_matches').select('*').in('id', [...linkedBoxIds]) : Promise.resolve({ data: [] }),
        peopleList.length
            ? client.from('box_league_teams').select('id, player1_id, player1_name, player2_id, player2_name')
                .or(`player1_id.in.(${peopleList.join(',')}),player2_id.in.(${peopleList.join(',')})`)
            : Promise.resolve({ data: [] })
    ]);
    const teamIds = (teams || []).map(t => t.id);
    const { data: windowBoxes } = teamIds.length
        ? await client.from('box_league_matches').select('*')
            .or(`team1_id.in.(${teamIds.join(',')}),team2_id.in.(${teamIds.join(',')})`)
            .gte('scheduled_date', start.toISOString()).lt('scheduled_date', end.toISOString())
        : { data: [] };
    const boxes = {};
    [...(linkedBoxes || []), ...(windowBoxes || [])].forEach(b => { boxes[lower(b.id)] = b; });
    const teamById = {};
    (teams || []).forEach(t => { teamById[lower(t.id)] = t; });
    const missing = [...new Set(Object.values(boxes).flatMap(b => [lower(b.team1_id), lower(b.team2_id)]))].filter(t => t && !teamById[t]);
    if (missing.length) {
        const { data: extra } = await client.from('box_league_teams').select('id, player1_id, player1_name, player2_id, player2_name').in('id', missing);
        (extra || []).forEach(t => { teamById[lower(t.id)] = t; });
    }

    // Everything as one shape: { id, completed, sides: [{ ids, names, sets, won }] }
    const results = {};
    [...(linkedMatches || []), ...(dayMatches || [])].forEach(m => {
        results[lower(m.id)] = {
            id: lower(m.id),
            completed: m.status === 'COMPLETED',
            sides: [1, 2].map(n => ({
                ids: (m[`team${n}_player_ids`] || []).map(lower),
                names: m[`team${n}_players`] || [],
                sets: m[`team${n}_set_scores`] || [],
                won: Number(m[`team${n}_sets_won`]) || 0
            }))
        };
    });
    Object.values(boxes).forEach(b => {
        const key = lower(b.id);
        const played = b.scheduled_date ? new Date(b.scheduled_date) : start;
        if (!linked.has(key) && !(played >= start && played < end)) return;
        if (results[key]) return;
        const side = (teamId, sets, won) => {
            const t = teamById[lower(teamId)] || {};
            const ids = [t.player1_id, t.player2_id].filter(Boolean).map(lower);
            return { ids, names: [t.player1_name, t.player2_name].filter(Boolean), sets: sets || [], won: Number(won) || 0 };
        };
        results[key] = {
            id: key,
            completed: !!b.is_completed,
            sides: [side(b.team1_id, b.team1_set_scores, b.team1_score), side(b.team2_id, b.team2_set_scores, b.team2_score)]
        };
    });

    const registered = side => side.ids.filter(i => TV_UUID_ANY.test(i));
    const counted = Object.values(results).filter(r => {
        if (linked.has(r.id)) return true;
        if (!r.completed) return false;
        return [...registered(r.sides[0]), ...registered(r.sides[1])].filter(i => people.has(i)).length >= 3;
    });

    // Pre-match rating: the row just before this match's own row in each player's history.
    const playerIds = [...new Set(counted.flatMap(r => [...registered(r.sides[0]), ...registered(r.sides[1])]))];
    const history = {};
    // Paged like the app: the server returns at most 1,000 rows, and a cut-off
    // history gives the wrong rating before a match, or none.
    const PAGE = 1000;
    for (let i = 0; i < playerIds.length; i += 40) {
        const rows = [];
        for (let from = 0; ; from += PAGE) {
            const { data, error } = await client.from('ratings').select('id, date, rating_0_10, match_id')
                .in('id', playerIds.slice(i, i + 40)).lte('date', end.toISOString())
                .order('id', { ascending: true }).order('date', { ascending: false })
                .range(from, from + PAGE - 1);
            if (error) throw error;
            rows.push(...(data || []));
            if (!data || data.length < PAGE) break;
        }
        rows.forEach(row => {
            const key = lower(row.id);
            if (row.rating_0_10 == null) return;
            (history[key] = history[key] || []).push({ date: new Date(row.date), rating: Number(row.rating_0_10), matchId: lower(row.match_id) });
        });
    }
    Object.values(history).forEach(list => list.sort((a, b) => b.date - a.date));
    const preMatch = (playerId, matchId) => {
        const list = history[playerId] || [];
        const at = list.findIndex(e => e.matchId === matchId);
        return at >= 0 && at + 1 < list.length ? list[at + 1].rating : null;
    };

    let unscored = 0;
    const candidates = [];
    counted.forEach(r => {
        if (!r.completed) { unscored += 1; return; }
        const [a, b] = r.sides;
        if (a.won === b.won) return;
        const ida = registered(a), idb = registered(b);
        if (ida.length !== 2 || idb.length !== 2) return;
        const ra = ida.map(p => preMatch(p, r.id)), rb = idb.map(p => preMatch(p, r.id));
        if (ra.some(v => v == null) || rb.some(v => v == null)) return;
        const p1 = 1 / (1 + Math.pow(10, -(((ra[0] + ra[1]) / 2) - ((rb[0] + rb[1]) / 2)) / WIN_PROBABILITY_SCALE));
        if (!Number.isFinite(p1)) return;
        const t1 = Math.min(100, Math.max(0, Math.round(p1 * 100)));
        const winnerFirst = a.won > b.won;
        candidates.push({ r, percent: winnerFirst ? t1 : 100 - t1, winners: winnerFirst ? a : b, losers: winnerFirst ? b : a });
    });
    if (!candidates.length) return { picks: [], unscored };
    const best = Math.min(...candidates.map(c => c.percent));
    const picks = candidates.filter(c => c.percent === best).sort((x, y) => (x.r.id < y.r.id ? -1 : 1)).map(c => {
        // Social fixtures store the rating in the name, "Aziz (5.4)": the TV shows the name alone.
        const clean = name => String(name || '').replace(/\s*\(\d+(\.\d+)?\)\s*$/, '').trim() || 'Player';
        const people = side => side.names.map((name, i) => ({ name: clean(name), id: side.ids[i] || null }));
        const names = performanceFirstNames(c.winners.names.map(clean));
        const sets = `${c.winners.won}–${c.losers.won}`;
        const n = c.percent;
        const sentence = n <= 45
            ? `${names} caused an upset, defying their ${n}% win probability to win ${sets}`
            : n >= 55
                ? `${names} won as expected with a ${n}% win probability, ${sets}`
                : `${names} won ${sets} in a match that looked close on paper (${n}% win probability)`;
        return {
            percent: n,
            winners: people(c.winners),
            losers: people(c.losers),
            score: performanceScore(c.winners.sets, c.losers.sets, c.winners.won, c.losers.won),
            sentence
        };
    });
    return { picks, unscored };
}

async function performanceLoad() {
    const client = tvSupabase();
    const clubId = await clubTvClubId();
    if (!client || !clubId) { performanceNights = []; return; }
    const now = new Date();
    const since = tvYmd(new Date(now.getTime() - (PERFORMANCE_SHOW_DAYS + 2) * 24 * 3600 * 1000));
    const [{ data: sessions, error }, { data: formats }] = await Promise.all([
        client.from('club_sessions').select('id, club_id, format_id, play_date, status')
            .eq('club_id', clubId).eq('status', 'published').gte('play_date', since)
            .order('play_date', { ascending: false }),
        client.from('session_formats').select('id, name').eq('club_id', clubId)
    ]);
    if (error) throw error;
    const formatName = {};
    (formats || []).forEach(f => { formatName[f.id] = f.name; });
    // Revealed from the London midnight after the night, for a week, latest per format.
    const shown = [];
    const seen = new Set();
    (sessions || []).forEach(s => {
        const reveal = tvLondonMidnight(s.play_date, 1);
        const until = new Date(reveal.getTime() + PERFORMANCE_SHOW_DAYS * 24 * 3600 * 1000);
        if (now < reveal || now >= until || seen.has(s.format_id)) return;
        seen.add(s.format_id);
        shown.push(s);
    });
    const nights = await Promise.all(shown.map(async session => {
        const night = await performanceNight(client, session);
        return { session, formatName: formatName[session.format_id] || 'Club social', ...night };
    }));
    performanceNights = nights.filter(n => n.picks.length);
}

// One centred column: photos, names, score, then the sentence with the win
// probability picked out in its colour. The percent appears once.
function performancePickHtml(pick, index) {
    const lean = pick.percent <= 45 ? ' tv-prob-low' : pick.percent >= 55 ? ' tv-prob-high' : '';
    const pct = `${pick.percent}%`;
    const sentence = tvEsc(pick.sentence).replace(pct, `<strong class="tv-potw-pct${lean}">${pct}</strong>`);
    const names = pick.winners.map(p => tvEsc(p.name)).join(' <span class="tv-potw-and">&amp;</span> ');
    return `<div class="tv-potw-pick tv-pop" style="--i:${index + 1}">
        <div class="tv-potw-faces">${tvPairAvatars(pick.winners, 'tv-ring-1')}</div>
        <div class="tv-potw-names">${names}</div>
        <div class="tv-potw-score">${tvEsc(pick.score)}</div>
        <div class="tv-potw-line">${sentence}</div>
        <div class="tv-potw-against"><span class="tv-potw-against-label">Against</span>${tvPairAvatars(pick.losers)}<span class="tv-potw-against-names">${tvEsc(pick.losers.map(p => p.name).join(' & '))}</span></div>
    </div>`;
}

function performancePages() {
    return performanceNights.map(night => {
        const joint = night.picks.length > 1;
        const day = new Date(`${night.session.play_date}T12:00:00Z`).toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' });
        return {
            key: night.session.id,
            label: night.formatName,
            now: joint ? 'Joint winners' : 'Winners',
            ids: night.picks.flatMap(p => [...p.winners, ...p.losers].map(x => x.id)),
            header: () => ({
                title: 'Performance of the week',
                stage: night.formatName,
                detail: day
            }),
            html: () => `<div class="tv-potw${joint ? ' tv-potw-joint' : ''}">
                <div class="tv-potw-picks">${night.picks.slice(0, 2).map((p, i) => performancePickHtml(p, i)).join('')}</div>
                ${night.unscored ? `<div class="tv-potw-foot tv-rise" style="--i:4">${night.unscored === 1 ? '1 fixture still has no score.' : `${night.unscored} fixtures still have no score.`} A late result can change this.</div>` : ''}
            </div>`
        };
    });
}

// ── Club TV: every screen in one playlist ─────────────────────
//
// A source loads its own data for the player's home club and returns pages,
// each carrying its own header. The club TV plays the sources in
// CLUB_TV_PLAYLIST order, skips any with nothing on, then starts again.
// To add a screen: write a source below and add its key to the playlist.

const CLUB_TV_ROTATE_MS = 8000;
const CLUB_TV_REFRESH_MS = 30000;
const CLUB_TV_RESULTS_HOURS = 12; // finished Americanos and tournaments stay on for this long

const CLUB_TV_PLAYLIST = ['onCourt', 'performance', 'boxLeagues', 'americanos', 'tournaments', 'rankings'];

let clubTvAmericanos = [];
let clubTvTournaments = [];
let clubTvTournamentStore = { teams: {}, matches: {}, groups: {} };
let clubTvRankings = [];

async function clubTvClubId() {
    return typeof resolveAmericanoClubId === 'function' ? resolveAmericanoClubId() : null;
}

function clubTvSince(hours) {
    return new Date(Date.now() - hours * 3600 * 1000).toISOString();
}

// Prefixes a page's label with the event name, so the countdown reads well.
function clubTvNamed(pages, name) {
    return pages.map(page => ({ ...page, label: name ? `${name} · ${page.label}` : page.label }));
}

const CLUB_TV_SOURCES = {
    // Matches being played now, then what starts in the next few hours, one page per start time.
    onCourt: {
        title: 'On court',
        load: onCourtLoad,
        pages: onCourtPages
    },

    // The least likely winning pair from the club's latest social, for a week.
    performance: {
        title: 'Performance of the week',
        rail: 'Social', // short, so it doesn't stretch the rail
        load: performanceLoad,
        pages: performancePages
    },

    boxLeagues: {
        title: 'Box leagues',
        load: boxLeagueTvLoad,
        pages: () => boxLeagueTvPages().filter(page => page.league)
            .map(page => ({ ...page, label: `${page.group} · ${page.label}` }))
    },

    // Live sessions, and ones that finished in the last few hours.
    americanos: {
        title: 'Americano',
        async load() {
            const client = tvSupabase();
            const clubId = await clubTvClubId();
            if (!client || !clubId) { clubTvAmericanos = []; return; }
            const { data: sessions, error } = await client.from('americano_sessions')
                .select('share_token, status, play_at, updated_at')
                .eq('club_id', clubId)
                .in('status', ['live', 'completed'])
                .gte('updated_at', clubTvSince(CLUB_TV_RESULTS_HOURS));
            if (error) throw error;
            const ordered = (sessions || []).filter(s => s.share_token)
                .sort((a, b) => (a.status === 'live' ? 0 : 1) - (b.status === 'live' ? 0 : 1) || String(a.play_at).localeCompare(String(b.play_at)));
            const loaded = await Promise.all(ordered.map(s => client.rpc('get_americano_by_token', { token: s.share_token })
                .then(({ data }) => data).catch(() => null)));
            clubTvAmericanos = loaded.filter(d => d?.session);
        },
        pages: () => clubTvAmericanos.flatMap(data => clubTvNamed(americanoTvPages(data), data.session.session_name))
    },

    // Tournaments in play, and ones that finished in the last few hours.
    tournaments: {
        title: 'Tournaments',
        async load() {
            const client = tvSupabase();
            const clubId = await clubTvClubId();
            if (!client || !clubId) { clubTvTournaments = []; return; }
            const { data: rows, error } = await client.from('bracket_tournaments').select('*')
                .eq('club_id', clubId).eq('is_private', false).in('status', ['active', 'completed'])
                .order('start_date', { ascending: true });
            if (error) throw error;
            const since = clubTvSince(CLUB_TV_RESULTS_HOURS);
            const tournaments = (rows || []).filter(t => t.status === 'active' || String(t.updated_at) >= since);
            const ids = tournaments.map(t => t.id);
            const store = { teams: {}, matches: {}, groups: {} };
            if (ids.length) {
                const [{ data: teams }, { data: matches }, { data: groups }] = await Promise.all([
                    client.from('bracket_tournament_teams').select('*').in('tournament_id', ids),
                    client.from('bracket_tournament_matches').select('*').in('tournament_id', ids),
                    client.from('bracket_tournament_groups').select('*').in('tournament_id', ids)
                ]);
                const index = (list, key) => (list || []).forEach(row => { (store[key][row.tournament_id] = store[key][row.tournament_id] || []).push(row); });
                index(teams, 'teams');
                index(matches, 'matches');
                index(groups, 'groups');
                Object.values(store.groups).forEach(list => list.sort((a, b) => (a.group_index || 0) - (b.group_index || 0)));
            }
            clubTvTournaments = tournaments;
            clubTvTournamentStore = store;
        },
        pages: () => clubTvTournaments.flatMap(t => clubTvNamed(tournamentTvPages(t, clubTvTournamentStore), t.name))
    },

    // The podium and the top 40.
    rankings: {
        title: 'Rankings',
        async load() {
            const client = tvSupabase();
            const clubId = await clubTvClubId();
            if (!client || !clubId) { clubTvRankings = []; return; }
            const cutoff = new Date();
            cutoff.setMonth(cutoff.getMonth() - 4);
            const { data, error } = await client.from('player_search_view')
                .select('id, display_name, current_rating, avatar_url, last_activity_at')
                .eq('club_id', clubId).gte('last_activity_at', cutoff.toISOString())
                .order('current_rating', { ascending: false }).limit(FS_MAX_PLAYERS);
            if (error) throw error;
            clubTvRankings = (data || [])
                .map(row => ({ id: row.id, display_name: row.display_name, avatar_url: row.avatar_url, rating_0_10: Number(row.current_rating) }))
                .filter(p => p.id && p.rating_0_10 > 0);
        },
        pages: () => (clubTvRankings.length ? rankingsTvPages(clubTvRankings, 3) : [])
    }
};

let clubTvLoaded = false;
let clubTvTimer = null;

async function clubTvLoad() {
    await Promise.all(CLUB_TV_PLAYLIST.map(key => CLUB_TV_SOURCES[key]?.load()
        .catch(err => console.warn('Club TV could not load', key, err))));
    clubTvLoaded = true;
}

function clubTvPages() {
    if (!clubTvLoaded) return [{ key: 'loading', label: '', now: '', ids: [], html: () => '<div class="tv-empty">Loading what’s on at your club…</div>' }];
    const pages = CLUB_TV_PLAYLIST.flatMap(key => {
        const source = CLUB_TV_SOURCES[key];
        if (!source) return [];
        let list = [];
        try { list = source.pages(); } catch (err) { console.warn('Club TV page error', key, err); }
        return list.map(page => ({ ...page, key: `${key}:${page.key}`, group: source.rail || source.title, nowLabel: source.title }));
    });
    if (pages.length) return pages;
    const reason = window.currentUserClubData && window.currentUserClubData.club_name !== 'No Club Assigned'
        ? 'Nothing on at your club right now.'
        : 'Choose your club under Profile in the PadelPals app to show what’s on.';
    return [{ key: 'none', label: '', now: '', ids: [], html: () => `<div class="tv-empty">${reason}</div>` }];
}

const clubTv = new TvScreen({
    id: 'clubTvOverlay',
    ariaLabel: 'Club TV',
    rotateMs: CLUB_TV_ROTATE_MS,
    compactRail: true,
    pages: clubTvPages,
    header: () => {
        const club = window.currentUserClubData?.club_name;
        return { title: club && club !== 'No Club Assigned' ? club : 'Club TV', stage: 'Club TV', detail: clubTvLoaded ? '' : 'Loading' };
    },
    onClose: () => {
        clearInterval(clubTvTimer);
        clubTvTimer = null;
    }
});

async function openClubTv() {
    clubTvLoaded = false;
    clubTv.open();
    await clubTvLoad();
    clubTv.goTo(0);
    clearInterval(clubTvTimer);
    clubTvTimer = setInterval(async () => {
        if (document.hidden || !clubTv.isOpen) return;
        await clubTvLoad();
        clubTv.refresh();
    }, CLUB_TV_REFRESH_MS);
}

function closeClubTv() {
    clubTv.close();
}

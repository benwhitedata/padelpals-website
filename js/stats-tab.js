// Padel Pals Stats Tab Logic
// This script powers the Stats tab in dashboard.html
// It fetches matches for the authenticated user, computes player stats, and renders them.

(async function() {
    // Wait for DOM and Supabase config
    if (!window.supabase) {
        await new Promise(resolve => {
            document.addEventListener('configLoaded', resolve, { once: true });
        });
    }
    const supabase = window.supabase.createClient(window.config.supabaseUrl, window.config.supabaseKey);

    // UI Elements
    const statsTab = document.getElementById('stats');
    const matchStatsDiv = document.getElementById('matchStats');
    if (!statsTab || !matchStatsDiv) return;

    // Add filter/search bar
    const filterBar = document.createElement('div');
    filterBar.className = 'mb-3 d-flex flex-wrap gap-2 align-items-center';
    filterBar.innerHTML = `
        <input type="text" class="form-control" id="statsSearch" placeholder="Search players..." style="max-width:200px;">
        <select class="form-select" id="statsTimeFilter" style="max-width:150px;">
            <option value="all">All Time</option>
            <option value="month">This Month</option>
            <option value="week">This Week</option>
            <option value="today">Today</option>
        </select>
        <button class="btn btn-outline-primary" id="myMatchesToggle">My Matches Only</button>
        <span id="statsLoading" class="ms-3" style="display:none;"><span class="spinner-border spinner-border-sm"></span> Loading...</span>
    `;
    matchStatsDiv.appendChild(filterBar);

    // Stats table container
    const statsTableDiv = document.createElement('div');
    matchStatsDiv.appendChild(statsTableDiv);

    // State
    let allMatches = [];
    let playerStats = [];
    let showOnlyMyMatches = true;
    let timeFilter = 'all';
    let searchText = '';
    let currentUserId = null;
    let isAdmin = false;
    let currentUserName = '';

    // Helper: get start date for filter
    function getFilterDate() {
        const now = new Date();
        if (timeFilter === 'today') {
            return new Date(now.getFullYear(), now.getMonth(), now.getDate());
        } else if (timeFilter === 'week') {
            const day = now.getDay();
            const diff = now.getDate() - day + (day === 0 ? -6 : 1); // Monday as first day
            return new Date(now.setDate(diff));
        } else if (timeFilter === 'month') {
            return new Date(now.getFullYear(), now.getMonth(), 1);
        }
        return null;
    }

    // Fetch user info and matches
    async function loadStatsData() {
        document.getElementById('statsLoading').style.display = '';
        // Get session
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
            statsTableDiv.innerHTML = '<div class="alert alert-danger">Not signed in.</div>';
            return;
        }
        currentUserId = session.user.id;
        // Get profile for admin check and display name
        const { data: profile } = await supabase.from('profiles').select('*').eq('id', currentUserId).single();
        isAdmin = profile && profile.is_admin === true;
        currentUserName = profile && (profile.display_name || profile.full_name || session.user.email);

        // Fetch matches: if admin, get all; else, only matches involving user
        let matchQuery = supabase.from('matches').select('*');
        if (!isAdmin) {
            matchQuery = matchQuery.or(`team1_player_ids.cs.{${currentUserId}},team2_player_ids.cs.{${currentUserId}}`);
        }
        const { data: matches, error } = await matchQuery;
        if (error) {
            statsTableDiv.innerHTML = '<div class="alert alert-danger">Failed to load matches: ' + error.message + '</div>';
            document.getElementById('statsLoading').style.display = 'none';
            return;
        }
        allMatches = matches || [];
        computeAndRenderStats();
        document.getElementById('statsLoading').style.display = 'none';
    }

    // Compute stats for each player
    function computeAndRenderStats() {
        // Filter matches
        let filtered = allMatches.filter(m => m.status === 'completed' && m.team1_sets_won !== m.team2_sets_won);
        // Time filter
        const filterDate = getFilterDate();
        if (filterDate) {
            filtered = filtered.filter(m => new Date(m.played_date) >= filterDate);
        }
        // My matches only
        if (showOnlyMyMatches && currentUserId) {
            filtered = filtered.filter(m => (m.team1_player_ids && m.team1_player_ids.includes(currentUserId)) || (m.team2_player_ids && m.team2_player_ids.includes(currentUserId)));
        }
        // Search
        if (searchText) {
            filtered = filtered.filter(m => {
                const allPlayers = [...(m.team1_players||[]), ...(m.team2_players||[])].join(' ').toLowerCase();
                return allPlayers.includes(searchText.toLowerCase());
            });
        }
        // Build stats per player
        const statsMap = {};
        filtered.forEach(match => {
            // For each player in both teams
            [
                { team: 'team1', won: match.team1_sets_won > match.team2_sets_won },
                { team: 'team2', won: match.team2_sets_won > match.team1_sets_won }
            ].forEach(({team, won}) => {
                (match[team + '_players'] || []).forEach((name, idx) => {
                    const id = (match[team + '_player_ids'] && match[team + '_player_ids'][idx]) || name;
                    if (!statsMap[id]) {
                        statsMap[id] = {
                            name,
                            gamesPlayed: 0,
                            gamesWon: 0,
                            setsPlayed: 0,
                            setsWon: 0,
                            partners: {},
                            opponents: {},
                        };
                    }
                    const s = statsMap[id];
                    s.gamesPlayed++;
                    if (won) s.gamesWon++;
                    s.setsPlayed += match.number_of_sets || 0;
                    s.setsWon += match[team + '_sets_won'] || 0;
                    // Partners
                    (match[team + '_players'] || []).forEach((partner, pidx) => {
                        if (pidx !== idx) {
                            s.partners[partner] = (s.partners[partner] || 0) + 1;
                        }
                    });
                    // Opponents
                    const oppTeam = team === 'team1' ? 'team2' : 'team1';
                    (match[oppTeam + '_players'] || []).forEach(opponent => {
                        s.opponents[opponent] = (s.opponents[opponent] || 0) + 1;
                    });
                });
            });
        });
        // Convert to array
        playerStats = Object.values(statsMap).map(s => ({
            ...s,
            winPct: s.gamesPlayed ? (s.gamesWon / s.gamesPlayed * 100).toFixed(1) : '0.0',
            setsWinPct: s.setsPlayed ? (s.setsWon / s.setsPlayed * 100).toFixed(1) : '0.0',
            bestPartner: Object.entries(s.partners).sort((a,b)=>b[1]-a[1])[0]?.[0] || '-',
            toughestOpponent: Object.entries(s.opponents).sort((a,b)=>b[1]-a[1])[0]?.[0] || '-',
        }));
        renderStatsTable();
    }

    // Render stats table
    function renderStatsTable() {
        if (!playerStats.length) {
            statsTableDiv.innerHTML = '<div class="alert alert-info">No match data found for the selected filters.</div>';
            return;
        }
        let html = `<div class="table-responsive"><table class="table table-striped table-hover align-middle"><thead><tr>
            <th>Player</th><th>Played</th><th>Wins</th><th>Win %</th><th>Sets</th><th>Sets Won</th><th>Sets Win %</th><th>Best Partner</th><th>Toughest Opponent</th>
        </tr></thead><tbody>`;
        playerStats.forEach(s => {
            html += `<tr><td>${s.name}</td><td>${s.gamesPlayed}</td><td>${s.gamesWon}</td><td>${s.winPct}%</td><td>${s.setsPlayed}</td><td>${s.setsWon}</td><td>${s.setsWinPct}%</td><td>${s.bestPartner}</td><td>${s.toughestOpponent}</td></tr>`;
        });
        html += '</tbody></table></div>';
        statsTableDiv.innerHTML = html;
    }

    // Event listeners
    document.getElementById('statsSearch').addEventListener('input', e => { searchText = e.target.value; computeAndRenderStats(); });
    document.getElementById('statsTimeFilter').addEventListener('change', e => { timeFilter = e.target.value; computeAndRenderStats(); });
    document.getElementById('myMatchesToggle').addEventListener('click', e => { showOnlyMyMatches = !showOnlyMyMatches; e.target.classList.toggle('btn-primary', showOnlyMyMatches); e.target.classList.toggle('btn-outline-primary', !showOnlyMyMatches); computeAndRenderStats(); });

    // Only load data when tab is shown
    document.getElementById('stats-tab').addEventListener('shown.bs.tab', loadStatsData);
    // If already active, load immediately
    if (document.getElementById('stats-tab').classList.contains('active')) loadStatsData();
})(); 
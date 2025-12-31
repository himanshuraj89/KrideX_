import { API_CONFIG } from '../config/apiConfig';
import customMatches from '../data/customMatches.json';

// Keys accessed dynamically in functions to support runtime updates
// const CRICKET_API_KEY = API_CONFIG.CRICKET_API_KEY || API_CONFIG.API_KEY;
// const API_SPORTS_KEY = API_CONFIG.API_SPORTS_KEY;

// Cache for completed matches to avoid repeated API calls
const yesterdayCache = {
    basketball: null,
    football: null,
    hockey: null,
    lastUpdated: null
};

// Cricket API functions (using existing CricAPI) - Filtered like Cricbuzz (only important matches)
// Cricket API functions (using existing CricAPI) - showing ALL matches with smart sorting
async function fetchCricketMatches() {
    const CRICKET_API_KEY = API_CONFIG.CRICKET_API_KEY || API_CONFIG.API_KEY;
    try {
        // Fetch multiple pages to ensure we get all live matches (domestic often on later pages)
        const fetchPage = async (offset) => {
            try {
                const timestamp = new Date().getTime(); // Cache buster
                const response = await fetch(`https://api.cricapi.com/v1/currentMatches?apikey=${CRICKET_API_KEY}&offset=${offset}&t=${timestamp}`);
                const data = await response.json();
                if (data.status !== "success") {
                    console.warn(`CricAPI page offset ${offset} failed:`, data);
                    return [];
                }
                return data.data || [];
            } catch (err) {
                console.warn(`Error fetching page offset ${offset}:`, err);
                return [];
            }
        };

        // Fetch first 5 pages concurrently (125 matches approx) to catch domestic matches
        const [page1, page2, page3, page4, page5] = await Promise.all([
            fetchPage(0),
            fetchPage(25),
            fetchPage(50),
            fetchPage(75),
            fetchPage(100)
        ]);

        const rawMatches = [...page1, ...page2, ...page3, ...page4, ...page5];

        // Remove duplicates based on ID
        const uniqueMatches = Array.from(new Map(rawMatches.map(item => [item.id, item])).values());

        // Debug logging
        console.log(`Fetched ${uniqueMatches.length} unique cricket matches`);

        // Priority keywords for important matches sorting (NOT filtering)
        const priorityKeywords = [
            'ipl', 'indian premier league',
            'icc', 'world cup', 'champions trophy', 'championship',
            't20i', 't20 international', 'odi', 'test', 'test match',
            'asia cup', 'european cricket', 'cpl', 'bbl', 'psl',
            'bilateral', 'international', 'tri-series', 'women',
            // Indian Domestic (High Priority)
            'ranji', 'vijay hazare', 'syed mushtaq', 'duleep', 'deodhar',
            'irani', 'india a', 'india b', 'tnpl', 'maharaja', 'trophy'
        ];

        let allMatches = uniqueMatches.map(match => {
            // Determine league/category
            let league = 'Cricket';
            const matchName = (match.name || '').toLowerCase();
            const seriesName = (match.series || '').toLowerCase();

            if (matchName.includes('ipl') || seriesName.includes('ipl')) {
                league = 'IPL';
            } else if (matchName.includes('icc') || matchName.includes('world cup') || seriesName.includes('icc')) {
                league = 'ICC';
            } else if (matchName.includes('t20i') || matchName.includes('t20 international')) {
                league = 'International';
            } else if (matchName.includes('odi')) {
                league = 'International';
            } else if (matchName.includes('test')) {
                league = 'International';
            } else if (seriesName.includes('ranji')) {
                league = 'Ranji Trophy';
            } else if (seriesName.includes('vijay hazare')) {
                league = 'Vijay Hazare';
            } else if (seriesName.includes('syed mushtaq')) {
                league = 'Syed Mushtaq Ali';
            } else if (match.series_id) {
                league = seriesName || 'Tournament';
            }

            return mapCricketMatch(match, league);
        });

        // Inject Custom Matches (User Provided) EARLY to ensure they are sorted and cached
        const formattedCustomMatches = customMatches
            .filter(m => !m.sport || m.sport === 'cricket' || m.sport === 'Cricket') // Filter for Cricket only
            .map(m => {
                // Seed Detailed Scorecard Cache
                try {
                    // Adapt structure to what MatchDetailModal expects (innings array)
                    // We map the customMatches 'details.innings' to the structure api.js would return
                    if (m.details && m.details.innings) {
                        const scorecardData = {
                            data: m.details.innings.map((inn, idx) => ({
                                team: inn.team,
                                batting: inn.batting || [],
                                bowling: inn.bowling || [],
                                inning: inn.inning || `Inning ${idx + 1}`
                            })),
                            status: 'success'
                        };
                        // Use the exact key format api.js / MatchDetailModal expects
                        // Note: MatchDetailModal calls fetchMatchScorecard which usually hits API
                        // We will intercept this by pre-populating a local cache IF the component used it,
                        // but since MatchDetailModal calls API directly, we might need a way to force it.
                        // However, let's assume valid JSON structure first.
                        localStorage.setItem(`kridex_scorecard_${m.matchId}`, JSON.stringify(scorecardData));
                    }
                } catch (e) {
                    console.warn('Failed to seed custom match cache', e);
                }

                // Prefer dateTimeGMT if available (handled by JSON date strings)
                // If date contains T (ISO format), use it as dateTimeGMT
                const dateTimeGMT = m.date.includes('T') ? m.date : new Date(m.date).toISOString();

                // Correctly map scores to teams by name matching
                let mappedScore = null;
                if (m.details && m.details.innings && m.teams) {
                    mappedScore = m.teams.map(teamName => {
                        // Find the latest inning for this team
                        // Reverse finding to get the latest (2nd run, etc.)
                        const teamInning = [...m.details.innings].reverse().find(inn =>
                            inn.team && (inn.team.toLowerCase() === teamName.toLowerCase() || teamName.toLowerCase().includes(inn.team.toLowerCase()))
                        );

                        // Fallback: If no team name match, try to infer from order?
                        // But for now, rely on name.

                        if (teamInning) {
                            // Parse the score string "389" or "540/8 dec"
                            const runs = teamInning.score || (teamInning.r ? teamInning.r.toString() : '0');

                            // Try to parse wickets and overs if not explicitly provided
                            let w = teamInning.w;
                            let o = teamInning.o;

                            if (runs.includes('/')) {
                                // e.g. "540/8"
                                w = runs.split('/')[1]?.split(' ')[0]; // "8"
                            } else {
                                w = teamInning.w || 10; // Assume all out if just runs? No, safer to match JSON
                            }

                            return {
                                r: runs,
                                w: w,
                                o: o,
                                inning: teamInning.inning
                            };
                        }
                        return { r: 0, w: 0, o: 0 };
                    });
                } else {
                    mappedScore = m.score; // Fallback to raw score if details missing
                }

                return {
                    id: m.matchId,
                    name: m.matchName,
                    status: m.status,
                    venue: m.venue,
                    date: m.date,
                    dateTimeGMT: dateTimeGMT, // Use correct timing
                    teams: m.teams,
                    score: mappedScore,
                    series_id: 'custom-series',
                    league: m.league,
                    sport: 'cricket',
                    // Add sorting hint properties
                    isCustom: true
                };
            });

        // Combine API matches with custom matches
        allMatches = [...formattedCustomMatches, ...allMatches];

        // Calculate score for sorting
        allMatches.forEach(match => {
            let score = 0;
            const status = (match.status || '').toLowerCase();
            const combinedText = `${match.name || ''} ${match.series || ''}`.toLowerCase();

            // Custom matches priority
            if (match.isCustom) {
                score += 2000; // Super high priority for user added matches
            }

            // 1. Live matches get highest priority
            if (status.includes('live') || status.includes('in progress') || status.includes('started') ||
                status.includes('batting') || status.includes('bowling') || status.includes('inning') ||
                status.includes('opt to') || status.includes('elected to') || status.includes('chosen to') ||
                status.includes('delay') || status.includes('bad light') || status.includes('rain') ||
                status.includes('toss')) {
                score += 1000;
            }

            // 2. Important tournaments get medium priority
            if (priorityKeywords.some(k => combinedText.includes(k))) {
                score += 500;
            }

            // 3. International matches get priority
            if (match.series_id) {
                score += 100;
            }

            // 4. Completed matches get lower priority than live, but higher than simple scheduled
            if (status.includes('finished') || status.includes('completed') || status.includes('ended') || status.includes('result')) {
                score += 50;
            }

            match._sortScore = score;
        });

        // Sort matches: High score first, then by date (newest first)
        allMatches.sort((a, b) => {
            if (b._sortScore !== a._sortScore) {
                return b._sortScore - a._sortScore;
            }
            return new Date(b.date || 0) - new Date(a.date || 0);
        });

        // Identify and cache completed matches (Recently Played)
        const completedMatches = allMatches.filter(m => {
            const status = (m.status || '').toLowerCase();
            return status.includes('finished') || status.includes('completed') ||
                status.includes('ended') || status.includes('result') ||
                status.includes('won by') || status.includes('lost by');
        });

        if (completedMatches.length > 0) {
            // Cache the top 5 completed matches
            const matchesToCache = completedMatches.slice(0, 5);
            try {
                localStorage.setItem('kridex_cached_cricket_matches', JSON.stringify(matchesToCache));
                localStorage.setItem('kridex_cricket_cache_time', new Date().toISOString());
            } catch (e) {
                console.warn('Failed to cache cricket matches', e);
            }
        }



        const finalMatches = allMatches.slice(0, 100);

        // Update Short-Term Cache (2 min validity)
        if (finalMatches.length > 0) {
            try {
                localStorage.setItem(cacheKey, JSON.stringify(finalMatches));
                localStorage.setItem(cacheTimeKey, new Date().getTime().toString());
            } catch (e) {
                console.warn("Failed to update short-term cache:", e);
            }
        }

        return finalMatches;

    } catch (error) {
        console.error("Error fetching cricket matches:", error);

        // Fallback to cache if API fails
        try {
            const cached = localStorage.getItem('kridex_cached_cricket_matches');
            if (cached) {
                console.log("Serving cached cricket matches due to API error");
                return JSON.parse(cached);
            }
        } catch (e) {
            console.error("Error reading cricket cache:", e);
        }

        return [];
    }
}

// Helper to normalize Cricket Match Data
function mapCricketMatch(match, league) {
    // Ensure score is always an array of objects with 'r', 'w', 'o'
    let score = match.score;

    // Handle string scores (e.g. "120/3 (20)")
    if (typeof score === 'string') {
        score = [{ r: score, w: null, o: null }];
    } else if (!Array.isArray(score) && score && typeof score === 'object') {
        // Single object score
        score = [score];
    } else if (!score) {
        score = null;
    }

    return {
        ...match,
        sport: 'cricket',
        league: league || match.league || 'Cricket',
        score: score
    };
}

// Basketball API (api-sports.io) - Fetch both live and recent completed
async function fetchBasketballMatches(isRefresh = false) {
    const API_SPORTS_KEY = API_CONFIG.API_SPORTS_KEY;

    // 1. Prepare Custom Matches FIRST (Safety Logic)
    let customBasketballMatches = [];
    try {
        customBasketballMatches = customMatches
            .filter(m => m.sport === 'Basketball' || m.sport === 'basketball')
            .map(m => {
                const isFinished = m.status === 'Completed' || m.status === 'Finished';
                let mappedScore = null;
                if (m.score && m.teams) {
                    mappedScore = [
                        {
                            team: m.teams[0],
                            points: m.score.home ?? 0,
                            q1: m.score.quarters?.[0]?.h ?? (m.score.q1?.h) ?? null,
                            q2: m.score.quarters?.[1]?.h ?? (m.score.q2?.h) ?? null,
                            q3: m.score.quarters?.[2]?.h ?? (m.score.q3?.h) ?? null,
                            q4: m.score.quarters?.[3]?.h ?? (m.score.q4?.h) ?? null
                        },
                        {
                            team: m.teams[1],
                            points: m.score.away ?? 0,
                            q1: m.score.quarters?.[0]?.a ?? (m.score.q1?.a) ?? null,
                            q2: m.score.quarters?.[1]?.a ?? (m.score.q2?.a) ?? null,
                            q3: m.score.quarters?.[2]?.a ?? (m.score.q3?.a) ?? null,
                            q4: m.score.quarters?.[3]?.a ?? (m.score.q4?.a) ?? null
                        }
                    ];
                }

                return {
                    id: m.matchId,
                    name: m.matchName,
                    sport: 'basketball',
                    status: isFinished ? 'Finished' : m.status,
                    date: m.date,
                    teams: m.teams,
                    score: mappedScore,
                    venue: m.venue,
                    league: m.league,
                    isCustom: true,
                    _rawData: m
                };
            });
    } catch (e) {
        console.warn("Error processing custom basketball matches:", e);
    }

    try {
        const today = new Date().toISOString().split('T')[0];
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayStr = yesterday.toISOString().split('T')[0];

        // Fetch NBA games (league=12) for today and yesterday
        const promises = [
            fetch(
                `https://v1.basketball.api-sports.io/games?league=12&date=${today}`,
                {
                    headers: {
                        'x-apisports-key': API_SPORTS_KEY
                    }
                }
            )
        ];

        // Only fetch yesterday's matches if not refreshing, or if we don't have them cached
        if (!isRefresh || !yesterdayCache.basketball) {
            promises.push(
                fetch(
                    `https://v1.basketball.api-sports.io/games?league=12&date=${yesterdayStr}`,
                    {
                        headers: {
                            'x-apisports-key': API_SPORTS_KEY
                        }
                    }
                )
            );
        }

        const responses = await Promise.all(promises);
        const todayResponse = responses[0];
        const yesterdayResponse = responses[1]; // Will be undefined if we didn't fetch it

        // Process today's matches
        const response = todayResponse;

        if (!response.ok) {
            const errorText = await response.text();
            console.error(`Basketball API returned status ${response.status}:`, errorText);
            return [];
        }

        const data = await response.json();

        if (data.errors && data.errors.length > 0) {
            console.error('Basketball API errors:', data.errors);
            return [];
        }

        if (data.response === undefined) {
            console.warn('Basketball API: Unexpected response structure', data);
        }

        if (!data.response || data.response.length === 0) {
            return [];
        }

        // Map all matches (both live and completed) - filtering will be done in App.jsx
        const matches = data.response
            .filter(game => {
                // Exclude only scheduled/not started matches
                const status = (game.status?.long || game.status?.short || '').toLowerCase();
                const statusCode = game.status?.code || '';

                if (status.includes('scheduled') ||
                    status.includes('not started') ||
                    status.includes('postponed') ||
                    status.includes('cancelled') ||
                    statusCode === 'NS') {
                    return false;
                }

                // Include both live and completed matches
                return true;
            })
            .slice(0, 30) // Limit to 30 matches to reduce API load
            .map(game => {
                // All matches from NBA endpoint (league=12) are NBA
                const league = 'NBA';

                return {
                    id: `bb-${game.id}`,
                    name: `${game.teams?.home?.name || 'Home'} vs ${game.teams?.away?.name || 'Away'}`,
                    sport: 'basketball',
                    status: game.status?.long || game.status?.short || 'Live',
                    date: game.date,
                    teams: [game.teams?.home?.name || 'Home', game.teams?.away?.name || 'Away'],
                    score: game.scores ? [
                        {
                            team: game.teams?.home?.name || 'Home',
                            points: game.scores.home?.total ?? null,
                            q1: game.scores.home?.quarter_1,
                            q2: game.scores.home?.quarter_2,
                            q3: game.scores.home?.quarter_3,
                            q4: game.scores.home?.quarter_4
                        },
                        {
                            team: game.teams?.away?.name || 'Away',
                            points: game.scores.away?.total ?? null,
                            q1: game.scores.away?.quarter_1,
                            q2: game.scores.away?.quarter_2,
                            q3: game.scores.away?.quarter_3,
                            q4: game.scores.away?.quarter_4
                        }
                    ] : null,
                    venue: game.venue?.name || 'TBD',
                    league: league,
                    // Store full game data for detailed view
                    _rawData: game
                };
            });

        // Process yesterday's matches
        let yesterdayMatches = [];
        // Use cached data if available and we didn't fetch new data
        if (!yesterdayResponse && yesterdayCache.basketball) {
            yesterdayMatches = yesterdayCache.basketball;
        } else if (yesterdayResponse && yesterdayResponse.ok) {
            const yesterdayData = await yesterdayResponse.json();
            if (yesterdayData.response && yesterdayData.response.length > 0) {
                yesterdayMatches = yesterdayData.response
                    .filter(game => {
                        // Only include important leagues from yesterday
                        const status = (game.status?.long || game.status?.short || '').toLowerCase();
                        const statusCode = game.status?.code || '';

                        if (status.includes('scheduled') ||
                            status.includes('not started') ||
                            status.includes('postponed') ||
                            status.includes('cancelled') ||
                            statusCode === 'NS') {
                            return false;
                        }

                        // All matches from NBA endpoint (league=12) are important
                        return true;
                    })
                    .slice(0, 10) // Limit to 10 recent matches
                    .map(game => {
                        // All matches from this endpoint are NBA (league=12)
                        const league = 'NBA';

                        return {
                            id: `bb-${game.id}`,
                            name: `${game.teams?.home?.name || 'Home'} vs ${game.teams?.away?.name || 'Away'}`,
                            sport: 'basketball',
                            status: game.status?.long || game.status?.short || 'Finished',
                            date: game.date,
                            teams: [game.teams?.home?.name || 'Home', game.teams?.away?.name || 'Away'],
                            score: game.scores ? [
                                {
                                    team: game.teams?.home?.name || 'Home',
                                    points: game.scores.home?.total ?? null,
                                    q1: game.scores.home?.quarter_1,
                                    q2: game.scores.home?.quarter_2,
                                    q3: game.scores.home?.quarter_3,
                                    q4: game.scores.home?.quarter_4
                                },
                                {
                                    team: game.teams?.away?.name || 'Away',
                                    points: game.scores.away?.total ?? null,
                                    q1: game.scores.away?.quarter_1,
                                    q2: game.scores.away?.quarter_2,
                                    q3: game.scores.away?.quarter_3,
                                    q4: game.scores.away?.quarter_4
                                }
                            ] : null,
                            venue: game.venue?.name || 'TBD',
                            league: league,
                            _rawData: game
                        };
                    });

                // Update cache
                yesterdayCache.basketball = yesterdayMatches;
                yesterdayCache.lastUpdated = new Date();
            }
        }

        // Create a unique map for API matches
        const matchesMap = new Map(matches.map(m => [m.id, m]));

        // Custom matches are already prepared at the top of the function


        // Prepend custom matches
        // Prepend custom matches to whatever we found
        const finalMatches = [...customBasketballMatches, ...matches, ...yesterdayMatches];

        return finalMatches;
    } catch (error) {
        console.error("Error fetching basketball matches:", error);
        // Even if API fails, return custom matches!
        return customBasketballMatches;
    }
}

// Football API (api-sports.io) - Fetch both live and recent completed
// Football API (api-sports.io) - Fetch both live and recent completed
async function fetchFootballMatches(isRefresh = false) {
    const API_SPORTS_KEY = API_CONFIG.API_SPORTS_KEY;
    try {
        const today = new Date().toISOString().split('T')[0];
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayStr = yesterday.toISOString().split('T')[0];

        // Fetch today's and yesterday's matches
        const promises = [
            fetch(
                `https://v3.football.api-sports.io/fixtures?date=${today}`,
                {
                    headers: {
                        'x-apisports-key': API_SPORTS_KEY
                    }
                }
            )
        ];

        // Only fetch yesterday's matches if not refreshing, or if we don't have them cached
        if (!isRefresh || !yesterdayCache.football) {
            promises.push(
                fetch(
                    `https://v3.football.api-sports.io/fixtures?date=${yesterdayStr}`,
                    {
                        headers: {
                            'x-apisports-key': API_SPORTS_KEY
                        }
                    }
                )
            );
        }

        const responses = await Promise.all(promises);
        const todayResponse = responses[0];
        const yesterdayResponse = responses[1]; // Will be undefined if we didn't fetch it

        // Process today's matches
        let allMatches = [];

        if (todayResponse.ok) {
            const data = await todayResponse.json();
            if (data.response) {
                // Map ALL matches (no strict filtering yet)
                const mappedMatches = data.response
                    .filter(fixture => {
                        // Filter out cancelled/postponed to keep list clean, but keep Scheduled (NS)
                        const status = (fixture.fixture.status?.long || fixture.fixture.status?.short || '').toLowerCase();
                        return !status.includes('cancelled') && !status.includes('postponed');
                    })
                    .map(fixture => mapFootballFixture(fixture));
                allMatches = [...allMatches, ...mappedMatches];
            }
        }

        // Process yesterday's matches
        let yesterdayMatches = [];
        if (!yesterdayResponse && yesterdayCache.football) {
            yesterdayMatches = yesterdayCache.football;
        } else if (yesterdayResponse && yesterdayResponse.ok) {
            const data = await yesterdayResponse.json();
            if (data.response) {
                yesterdayMatches = data.response
                    .filter(fixture => {
                        const status = (fixture.fixture.status?.long || fixture.fixture.status?.short || '').toLowerCase();
                        // Only finished matches from yesterday
                        return status.includes('finished') || status.includes('full time') || status.includes('match finished');
                    })
                    .map(fixture => mapFootballFixture(fixture));

                // Update cache
                yesterdayCache.football = yesterdayMatches;
                yesterdayCache.lastUpdated = new Date();
            }
        }

        allMatches = [...allMatches, ...yesterdayMatches];

        // Smart Sorting Logic
        if (allMatches.length > 0) {
            const importantLeagues = [
                'premier league', 'la liga', 'bundesliga', 'serie a', 'ligue 1',
                'uefa champions league', 'uefa europa league', 'fa cup', 'euro', 'world cup'
            ];

            allMatches.forEach(match => {
                let score = 0;
                const status = (match.status || '').toLowerCase();
                const league = (match.league || '').toLowerCase();

                // 1. Live matches get highest priority
                if (status.includes('live') || status.includes('1h') || status.includes('2h') ||
                    status.includes('ht') || status.includes('et') || status.includes('p') ||
                    status.includes('playing')) {
                    score += 1000;
                }

                // 2. Important Leagues
                if (importantLeagues.some(l => league.includes(l))) {
                    score += 500;
                }

                // 3. Completed matches (Recently Played)
                if (status.includes('full time') || status.includes('finished') || status.includes('ft')) {
                    score += 100;
                }

                match._sortScore = score;
            });

            // Sort: High score first
            allMatches.sort((a, b) => b._sortScore - a._sortScore);

            // Limit to top 50 to avoid performance issues
            allMatches = allMatches.slice(0, 50);

            // Cache top completed matches for fallback
            const completedMatches = allMatches.filter(m => {
                const status = (m.status || '').toLowerCase();
                return status.includes('finished') || status.includes('full time');
            });

            if (completedMatches.length > 0) {
                try {
                    localStorage.setItem('kridex_cached_football_matches', JSON.stringify(completedMatches.slice(0, 5)));
                } catch (e) { console.warn('Failed to cache football matches', e); }
            }
        }

        return allMatches;

    } catch (error) {
        console.error("Error fetching football matches:", error);
        // Fallback to cache
        try {
            const cached = localStorage.getItem('kridex_cached_football_matches');
            if (cached) {
                console.log("Serving cached football matches due to API error");
                return JSON.parse(cached);
            }
        } catch (e) { }
        return [];
    }
}

// Helper to map API response to uniform structure
function mapFootballFixture(fixture) {
    let league = fixture.league?.name || 'Football';
    const leagueName = (fixture.league?.name || '').toLowerCase();
    const leagueCountry = (fixture.league?.country || '').toLowerCase();

    // Simplify league names for display
    if (leagueName.includes('premier league') && leagueCountry.includes('england')) league = 'Premier League';
    else if (leagueName.includes('la liga')) league = 'La Liga';
    else if (leagueName.includes('bundesliga') && !leagueName.includes('women')) league = 'Bundesliga';
    else if (leagueName.includes('serie a') && leagueCountry.includes('italy')) league = 'Serie A';
    else if (leagueName.includes('ligue 1')) league = 'Ligue 1';
    else if (leagueName.includes('uefa champions')) league = 'Champions League';

    return {
        id: `fb-${fixture.fixture.id}`,
        name: `${fixture.teams?.home?.name || 'Home'} vs ${fixture.teams?.away?.name || 'Away'}`,
        sport: 'football',
        status: fixture.fixture.status?.long || fixture.fixture.status?.short || (fixture.fixture.status?.elapsed ? `${fixture.fixture.status.elapsed}'` : 'Scheduled'),
        date: fixture.fixture.date,
        teams: [fixture.teams?.home?.name || 'Home', fixture.teams?.away?.name || 'Away'],
        score: fixture.goals ? [
            {
                team: fixture.teams?.home?.name || 'Home',
                goals: fixture.goals.home ?? null,
                halftime: fixture.score?.halftime?.home
            },
            {
                team: fixture.teams?.away?.name || 'Away',
                goals: fixture.goals.away ?? null,
                halftime: fixture.score?.halftime?.away
            }
        ] : null,
        venue: fixture.fixture.venue?.name || 'TBD',
        league: league,
        _rawData: fixture
    };
}

// Hockey API (api-sports.io) - Fetch both live and recent completed
async function fetchHockeyMatches(isRefresh = false) {
    const API_SPORTS_KEY = API_CONFIG.API_SPORTS_KEY;
    try {
        const today = new Date().toISOString().split('T')[0];
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayStr = yesterday.toISOString().split('T')[0];

        // Fetch today's and yesterday's matches
        const promises = [
            fetch(
                `https://v1.hockey.api-sports.io/games?date=${today}`,
                {
                    headers: {
                        'x-apisports-key': API_SPORTS_KEY
                    }
                }
            )
        ];

        // Only fetch yesterday's matches if not refreshing, or if we don't have them cached
        if (!isRefresh || !yesterdayCache.hockey) {
            promises.push(
                fetch(
                    `https://v1.hockey.api-sports.io/games?date=${yesterdayStr}`,
                    {
                        headers: {
                            'x-apisports-key': API_SPORTS_KEY
                        }
                    }
                )
            );
        }

        const responses = await Promise.all(promises);
        const todayResponse = responses[0];
        const yesterdayResponse = responses[1]; // Will be undefined if we didn't fetch it

        // Process today's matches
        const response = todayResponse;

        if (!response.ok) {
            const errorText = await response.text();
            console.error(`Hockey API returned status ${response.status}:`, errorText);
            return [];
        }

        const data = await response.json();

        if (data.errors && data.errors.length > 0) {
            console.error('Hockey API errors:', data.errors);
            return [];
        }

        if (data.response === undefined) {
            console.warn('Hockey API: Unexpected response structure', data);
        }

        if (!data.response || data.response.length === 0) {
            return [];
        }

        // Filter to only important leagues
        const matches = data.response
            .filter(game => {
                // Exclude scheduled/not started matches
                const status = (game.status?.long || game.status?.short || '').toLowerCase();
                const statusCode = game.status?.code || '';

                if (status.includes('scheduled') ||
                    status.includes('not started') ||
                    status.includes('postponed') ||
                    status.includes('cancelled') ||
                    statusCode === 'NS') {
                    return false;
                }

                // Only include major leagues (FIH Pro League, NHL, etc.)
                const leagueName = (game.league?.name || game.league?.type || '').toLowerCase();
                const isImportantLeague = leagueName.includes('fih') ||
                    leagueName.includes('nhl') ||
                    (leagueName.includes('hockey india') && leagueName.includes('women'));

                // Include if live OR it's an important league
                const isLive = status.includes('live') || status.includes('in progress');

                return isLive || isImportantLeague;
            })
            .slice(0, 30) // Limit to 30 matches to reduce API load
            .map(game => {
                // Identify league from API response
                let league = 'NHL';
                const leagueName = (game.league?.name || game.league?.type || '').toLowerCase();

                // FIH Hockey Pro League detection
                if (leagueName.includes('fih') ||
                    leagueName.includes('pro league') ||
                    (leagueName.includes('hockey') && leagueName.includes('pro'))) {
                    league = 'FIH Hockey Pro League';
                }
                // Hockey India League (Women)
                else if ((leagueName.includes('hockey india') && leagueName.includes('women')) ||
                    (leagueName.includes('india') && leagueName.includes('women') && leagueName.includes('hockey'))) {
                    league = 'Hockey India League (Women)';
                }
                // NHL detection
                else if (leagueName.includes('nhl') ||
                    leagueName.includes('national hockey league')) {
                    league = 'NHL';
                }

                return {
                    id: `hk-${game.id}`,
                    name: `${game.teams?.home?.name || 'Home'} vs ${game.teams?.away?.name || 'Away'}`,
                    sport: 'hockey',
                    status: game.status?.long || game.status?.short || 'Live',
                    date: game.date,
                    teams: [game.teams?.home?.name || 'Home', game.teams?.away?.name || 'Away'],
                    score: game.scores ? [
                        {
                            team: game.teams?.home?.name || 'Home',
                            goals: game.scores.home ?? null,
                            period1: game.scores?.period_1?.home,
                            period2: game.scores?.period_2?.home,
                            period3: game.scores?.period_3?.home,
                            period4: game.scores?.period_4?.home
                        },
                        {
                            team: game.teams?.away?.name || 'Away',
                            goals: game.scores.away ?? null,
                            period1: game.scores?.period_1?.away,
                            period2: game.scores?.period_2?.away,
                            period3: game.scores?.period_3?.away,
                            period4: game.scores?.period_4?.away
                        }
                    ] : null,
                    venue: game.venue?.name || 'TBD',
                    league: league,
                    // Store full game data for detailed view
                    _rawData: game
                };
            });

        // Process yesterday's matches
        let yesterdayMatches = [];

        // Use cached data if available and we didn't fetch new data
        if (!yesterdayResponse && yesterdayCache.hockey) {
            yesterdayMatches = yesterdayCache.hockey;
        } else if (yesterdayResponse && yesterdayResponse.ok) {
            const yesterdayData = await yesterdayResponse.json();
            if (yesterdayData.response && yesterdayData.response.length > 0) {
                yesterdayMatches = yesterdayData.response
                    .filter(game => {
                        // Only include important leagues from yesterday
                        const status = (game.status?.long || game.status?.short || '').toLowerCase();
                        const statusCode = game.status?.code || '';

                        if (status.includes('scheduled') ||
                            status.includes('not started') ||
                            status.includes('postponed') ||
                            status.includes('cancelled') ||
                            statusCode === 'NS') {
                            return false;
                        }

                        const leagueName = (game.league?.name || game.league?.type || '').toLowerCase();
                        const isImportantLeague = leagueName.includes('fih') ||
                            leagueName.includes('nhl') ||
                            (leagueName.includes('hockey india') && leagueName.includes('women'));

                        return isImportantLeague;
                    })
                    .slice(0, 10) // Limit to 10 recent matches
                    .map(game => {
                        // Identify league from API response
                        let league = 'NHL';
                        const leagueName = (game.league?.name || game.league?.type || '').toLowerCase();

                        // FIH Hockey Pro League detection
                        if (leagueName.includes('fih') ||
                            leagueName.includes('pro league') ||
                            (leagueName.includes('hockey') && leagueName.includes('pro'))) {
                            league = 'FIH Hockey Pro League';
                        }
                        // Hockey India League (Women)
                        else if ((leagueName.includes('hockey india') && leagueName.includes('women')) ||
                            (leagueName.includes('india') && leagueName.includes('women') && leagueName.includes('hockey'))) {
                            league = 'Hockey India League (Women)';
                        }
                        // NHL detection
                        else if (leagueName.includes('nhl') ||
                            leagueName.includes('national hockey league')) {
                            league = 'NHL';
                        }

                        return {
                            id: `hk-${game.id}`,
                            name: `${game.teams?.home?.name || 'Home'} vs ${game.teams?.away?.name || 'Away'}`,
                            sport: 'hockey',
                            status: game.status?.long || game.status?.short || 'Finished',
                            date: game.date,
                            teams: [game.teams?.home?.name || 'Home', game.teams?.away?.name || 'Away'],
                            score: game.scores ? [
                                {
                                    team: game.teams?.home?.name || 'Home',
                                    goals: game.scores.home ?? null,
                                    period1: game.scores?.period_1?.home,
                                    period2: game.scores?.period_2?.home,
                                    period3: game.scores?.period_3?.home,
                                    period4: game.scores?.period_4?.home
                                },
                                {
                                    team: game.teams?.away?.name || 'Away',
                                    goals: game.scores.away ?? null,
                                    period1: game.scores?.period_1?.away,
                                    period2: game.scores?.period_2?.away,
                                    period3: game.scores?.period_3?.away,
                                    period4: game.scores?.period_4?.away
                                }
                            ] : null,
                            venue: game.venue?.name || 'TBD',
                            league: league,
                            _rawData: game
                        };
                    });

                // Update cache
                yesterdayCache.hockey = yesterdayMatches;
                yesterdayCache.lastUpdated = new Date();
            }
        }

        return [...matches, ...yesterdayMatches];
    } catch (error) {
        console.error("Error fetching hockey matches:", error);
        return [];
    }
}

// Helper to check if a match has valid scores to display
function hasValidScore(match) {
    if (!match || !match.score) return false;

    // Cricket
    if (match.sport === 'cricket') {
        // Must have at least one score string
        if (Array.isArray(match.score)) {
            return match.score.some(s => s && s.r !== undefined && s.r !== null);
        }
        return false;
    }

    // Football, Basketball, Hockey
    if (Array.isArray(match.score)) {
        // Must have at least one team with a valid score number (0 is valid)
        return match.score.some(s => {
            return (s.points !== undefined && s.points !== null) ||
                (s.goals !== undefined && s.goals !== null);
        });
    }

    return false;
}

// Main function to fetch matches by sport
export async function fetchMatchesBySport(sport, isRefresh = false) {
    let matches = [];
    switch (sport) {
        case 'cricket':
            matches = await fetchCricketMatches();
            break;
        case 'basketball':
            matches = await fetchBasketballMatches(isRefresh);
            break;
        case 'football':
            matches = await fetchFootballMatches(isRefresh);
            break;
        case 'hockey':
            matches = await fetchHockeyMatches(isRefresh);
            break;
        default:
            matches = [];
    }

    // Strict filtering: Only return matches that have valid scores/results
    // OR are explicitly Live/In Progress (sometimes score delays happen)
    return matches.filter(match => {
        const hasScore = hasValidScore(match);
        const status = (match.status || '').toLowerCase();
        const isLive = status.includes('live') || status.includes('in progress') ||
            status.includes('playing') || status.includes('batting') ||
            status.includes('bowling');

        // Show if it has a score OR is currently live (even if score is 0-0/null momentarily)
        return hasScore || isLive;
    });
}

// Fetch all matches for all sports
export async function fetchAllSportsMatches(isRefresh = false) {
    try {
        const [cricket, basketball, football, hockey] = await Promise.all([
            fetchMatchesBySport('cricket', isRefresh).catch(err => {
                console.error('Error fetching cricket:', err);
                return [];
            }),
            fetchMatchesBySport('basketball', isRefresh).catch(err => {
                console.error('Error fetching basketball:', err);
                return [];
            }),
            fetchMatchesBySport('football', isRefresh).catch(err => {
                console.error('Error fetching football:', err);
                return [];
            }),
            fetchMatchesBySport('hockey', isRefresh).catch(err => {
                console.error('Error fetching hockey:', err);
                return [];
            })
        ]);

        const result = {
            cricket,
            basketball,
            football,
            hockey,
            all: [...cricket, ...basketball, ...football, ...hockey]
        };

        return result;
    } catch (error) {
        console.error("Error fetching all sports matches:", error);
        return {
            cricket: [],
            basketball: [],
            football: [],
            hockey: [],
            all: []
        };
    }
}

// Sport configuration
export const SPORT_CONFIG = {
    cricket: {
        name: 'Cricket',
        icon: '🏏',
        color: 'from-green-500 to-emerald-600',
        bgColor: 'bg-green-50',
        borderColor: 'border-green-200'
    },
    basketball: {
        name: 'Basketball',
        icon: '🏀',
        color: 'from-orange-500 to-red-600',
        bgColor: 'bg-orange-50',
        borderColor: 'border-orange-200'
    },
    football: {
        name: 'Football',
        icon: '⚽',
        color: 'from-blue-500 to-cyan-600',
        bgColor: 'bg-blue-50',
        borderColor: 'border-blue-200'
    },
    hockey: {
        name: 'Hockey',
        icon: '🏒',
        color: 'from-gray-500 to-slate-600',
        bgColor: 'bg-gray-50',
        borderColor: 'border-gray-200'
    }
};

import React, { useState, useEffect, useMemo, useRef } from 'react';
import SportCard from './components/SportCard';
import FollowedMatches from './components/FollowedMatches';
import MatchDetailModal from './components/MatchDetailModal';
import MatchSection from './components/MatchSection';
import LeagueSection from './components/LeagueSection';
import LeagueFilter from './components/LeagueFilter';
import AuthModal from './components/AuthModal';
import UserMenu from './components/UserMenu';
import { fetchAllSportsMatches, SPORT_CONFIG } from './services/multiSportApi';
import { useFollow } from './contexts/FollowContext';
import { useAuth } from './contexts/AuthContext';
import { debounce, observeElements, toggleBodyScroll, scrollToTop } from './utils/interactions';

function App() {
    const [selectedSport, setSelectedSport] = useState('all');
    const [selectedLeague, setSelectedLeague] = useState(null);
    const [allMatches, setAllMatches] = useState({});
    const [loading, setLoading] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [error, setError] = useState(null);
    const [selectedMatch, setSelectedMatch] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [viewMode, setViewMode] = useState('home'); // 'home' or 'sport'
    const [viewingSport, setViewingSport] = useState(null);
    const { followedSports, followedMatches } = useFollow();
    const { user, isAuthenticated, logout } = useAuth();

    // Reset league filter when sport changes
    useEffect(() => {
        setSelectedLeague(null);
    }, [selectedSport]);

    // League configuration for each sport
    const SPORT_LEAGUES = {
        football: [
            'Premier League',
            'La Liga',
            'AFC Women\'s Super League',
            'Frauen-Bundesliga'
        ],
        basketball: [
            'NBA',
            'Euro League',
            'NCAA College Basketball'
        ],
        hockey: [
            'FIH Hockey Pro League',
            'Hockey India League (Women)'
        ],
        cricket: [
            'IPL',
            'ICC'
        ]
    };

    // League icons
    const LEAGUE_ICONS = {
        'Premier League': '⚽',
        'La Liga': '⚽',
        'AFC Women\'s Super League': '⚽',
        'Frauen-Bundesliga': '⚽',
        'NBA': '🏀',
        'Euro League': '🏀',
        'NCAA College Basketball': '🏀',
        'FIH Hockey Pro League': '🏒',
        'Hockey India League (Women)': '🏒',
        'IPL': '🏏',
        'ICC': '🏏'
    };

    const mainContentRef = useRef(null);
    const [isScrolled, setIsScrolled] = useState(false);
    const [showScrollTop, setShowScrollTop] = useState(false);

    useEffect(() => {
        // TEMPORARY: Clear all data as requested by user
        localStorage.clear();
        console.log('User data cleared');

        loadMatches(true); // Initial load
        // Auto-refresh every 5 minutes (300,000 ms) or when user manually refreshes
        const interval = setInterval(() => loadMatches(false), 300000);
        return () => clearInterval(interval);
    }, []);

    // Handle scroll events
    useEffect(() => {
        const handleScroll = debounce(() => {
            const scrollY = window.scrollY;
            setIsScrolled(scrollY > 50);
            setShowScrollTop(scrollY > 300);
        }, 10);

        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    // Observe elements for fade-in animations
    useEffect(() => {
        if (!loading) {
            const observer = observeElements('.stagger-item', (element) => {
                element.classList.add('animate-fade-in');
            });
            return () => observer.disconnect();
        }
    }, [loading]);

    // Toggle body scroll when modal is open
    useEffect(() => {
        toggleBodyScroll(isModalOpen || isAuthModalOpen);
        return () => toggleBodyScroll(false);
    }, [isModalOpen, isAuthModalOpen]);

    const loadMatches = async (isInitialLoad = false) => {
        try {
            // Only show loading state on initial load, not on refresh
            if (isInitialLoad) {
                setLoading(true);
            } else {
                setIsRefreshing(true);
            }
            setError(null);
            const data = await fetchAllSportsMatches();
            setAllMatches(data);
        } catch (err) {
            const errorMessage = err.message || 'Failed to load matches. Please try again later.';
            // Only show error on initial load, not on background refresh
            if (isInitialLoad) {
                setError(errorMessage);
            }
            console.error('Error loading matches:', err);
        } finally {
            if (isInitialLoad) {
                setLoading(false);
            } else {
                setIsRefreshing(false);
            }
        }
    };

    // Organize matches into sections with priority
    const organizedMatches = useMemo(() => {
        let matches = [];

        // Get matches based on selected sport
        if (selectedSport === 'all') {
            matches = allMatches.all || [];
        } else if (selectedSport === 'followed') {
            // Only show followed matches if user is authenticated
            if (isAuthenticated && followedSports.length > 0) {
                matches = (allMatches.all || []).filter(m =>
                    followedSports.includes(m.sport || 'cricket')
                );
            } else {
                matches = [];
            }
        } else {
            matches = allMatches[selectedSport] || [];
        }

        // If user is searching, show only LIVE search results (limited)
        if (searchQuery.trim()) {
            const query = searchQuery.toLowerCase();
            const allSearchResults = matches.filter(match => {
                const name = match.name?.toLowerCase() || '';
                const teams = match.teams?.join(' ').toLowerCase() || '';
                const status = match.status?.toLowerCase() || '';
                const venue = match.venue?.toLowerCase() || '';
                const league = match.league?.toLowerCase() || '';
                return name.includes(query) ||
                    teams.includes(query) ||
                    status.includes(query) ||
                    venue.includes(query) ||
                    league.includes(query);
            });

            // Filter search results to ONLY show live matches
            const searchResults = allSearchResults.filter(match => {
                const status = (match.status || '').toLowerCase();

                // Exclude completed/finished matches
                if (status.includes('finished') ||
                    status.includes('completed') ||
                    status.includes('ended') ||
                    status.includes('ft') ||
                    status.includes('final') ||
                    status.includes('result') ||
                    status.includes('scheduled') ||
                    status.includes('not started')) {
                    return false;
                }

                // Must have live status AND scores
                const hasLiveStatus = status.includes('live') ||
                    status.includes('in progress') ||
                    status.includes('ongoing') ||
                    status.includes('started') ||
                    status.includes('opt to') ||
                    status.includes('elected to') ||
                    status.includes('batting') ||
                    status.includes('bowling') ||
                    status.includes('break') ||
                    status.includes('innings') ||
                    status.includes('inning') ||
                    status.includes('delay') ||
                    status.includes('rain') ||
                    status.includes('bad light') ||
                    status.includes('q') ||
                    status.includes('quarter') ||
                    status.includes('1h') ||
                    status.includes('2h') ||
                    status.includes('halftime') ||
                    status.includes('period') ||
                    status.includes('1st') ||
                    status.includes('2nd') ||
                    status.includes('3rd') ||
                    status.includes('4th');

                const hasScores = match.score &&
                    match.score.length > 0 &&
                    match.score.some(s => {
                        const hasPoints = s.points !== null && s.points !== undefined && s.points !== '';
                        const hasGoals = s.goals !== null && s.goals !== undefined && s.goals !== '';
                        const hasRuns = s.r !== null && s.r !== undefined && s.r !== '';
                        return hasPoints || hasGoals || hasRuns;
                    });

                return hasLiveStatus && hasScores;
            }).slice(0, 6);

            return {
                live: searchResults,
                leagues: {},
                searchResults: searchResults
            };
        }

        // Filter for matches that are ACTUALLY playing live RIGHT NOW
        const now = new Date();
        const liveMatches = matches.filter(match => {
            const status = (match.status || '').toLowerCase();

            // Improved LIVE filtering using API flags if available
            const isActive = match.matchEnded === false && match.matchStarted === true;

            // If explicit API flags say it's active, trust it!
            if (isActive) {
                // Still exclude purely "Scheduled" if API flag is misleading (rare)
                if (status.includes('scheduled') || status === 'ns') return false;
                return true;
            }

            // Fallback for providers that don't send matchEnded/matchStarted (e.g. Football/Basketball from api-sports)

            // STRICTLY exclude completed/finished/scheduled matches
            if (status.includes('finished') ||
                status.includes('completed') ||
                status.includes('ended') ||
                status.includes('ft') ||
                status.includes('final') ||
                status.includes('result') ||
                status.includes('scheduled') ||
                status.includes('not started') ||
                status.includes('postponed') ||
                status.includes('cancelled') ||
                status.includes('abandoned')) {
                return false;
            }

            // Check if match date/time indicates it should be live RIGHT NOW
            // RELAXED: Only check "future" matches. Don't auto-hide "old" matches if they have live status.
            if (match.date) {
                const matchDate = new Date(match.date);
                const timeDiff = now.getTime() - matchDate.getTime();

                // If match is more than 5 mins in future, it's not live yet
                if (timeDiff < -5 * 60 * 1000) {
                    return false;
                }
            }

            // MUST have explicit live status indicators
            const hasLiveStatus = status.includes('live') ||
                status.includes('in progress') ||
                status.includes('ongoing') ||
                status.includes('q') ||
                status.includes('quarter') ||
                status.includes('1h') ||
                status.includes('2h') ||
                status.includes('halftime') ||
                status.includes('period') ||
                status.includes('1st') ||
                status.includes('2nd') ||
                status.includes('3rd') ||
                status.includes('4th') ||
                status.includes('started') ||
                status.includes('opt to') ||
                status.includes('elected to') ||
                status.includes('batting') ||
                status.includes('bowling') ||
                status.includes('break') ||
                status.includes('innings') ||
                status.includes('inning') ||
                status.includes('bad light') ||
                status.includes('rain') ||
                status.includes('delay');

            if (!hasLiveStatus) {
                // Last ditch: if it has scores and is NOT one of the excluded statuses, show it?
                // Maybe not, to avoid showing scheduled matches with pre-match odds/scores errors
                return false;
            }

            return true;
        });

        // Get completed matches for recent results (more lenient - show matches with scores)
        const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        const completedMatches = matches.filter(match => {
            const status = (match.status || '').toLowerCase();

            // Check if match is completed (more flexible matching)
            const isCompleted = status.includes('finished') ||
                status.includes('completed') ||
                status.includes('ended') ||
                status.includes('ft') ||
                status.includes('final') ||
                status.includes('result') ||
                status.includes('closed') ||
                status.includes('won by') ||
                status.includes('lost by') ||
                status.includes('tied') ||
                status.includes('drawn') ||
                status.includes('abandoned') ||
                status.includes('no result') ||
                status === 'ft' ||
                status === 'aet' ||
                status === 'pen' ||
                status === ''; // Empty status might mean completed if has scores

            // Exclude scheduled/not started/live matches
            const isScheduled = status.includes('scheduled') ||
                status.includes('not started') ||
                status.includes('postponed') ||
                status.includes('cancelled') ||
                status.includes('live') ||
                status.includes('in progress') ||
                status.includes('ongoing') ||
                status.includes('halftime') ||
                status.includes('q') ||
                status.includes('quarter') ||
                status.includes('1h') ||
                status.includes('2h') ||
                status.includes('period') ||
                status.includes('1st') ||
                status.includes('2nd') ||
                status.includes('3rd') ||
                status.includes('4th') ||
                status.includes('started') ||
                status.includes('break') ||
                status.includes('toss') ||
                status.includes('stumps') ||
                status.includes('delay') ||
                status.includes('batting') ||
                status.includes('bowling') ||
                status.includes('innings');

            // Check if match has final scores
            const hasFinalScores = match.score &&
                match.score.length > 0 &&
                match.score.some(s => {
                    const hasPoints = s.points !== null && s.points !== undefined && s.points !== '';
                    const hasGoals = s.goals !== null && s.goals !== undefined && s.goals !== '';
                    const hasRuns = s.r !== null && s.r !== undefined && s.r !== '';
                    const hasScore = s.score !== null && s.score !== undefined && s.score !== '';
                    return hasPoints || hasGoals || hasRuns || hasScore;
                });

            // If no date, include if it has final scores and is not scheduled/live
            if (!match.date) {
                return !isScheduled && hasFinalScores && isCompleted;
            }

            const matchDate = new Date(match.date);
            // Include matches from last 30 days, or any match with final scores (more lenient)
            const isWithinDateRange = matchDate >= thirtyDaysAgo && matchDate <= now;

            // Strict check: Must be explicitly completed/finished AND not scheduled/live
            return isCompleted && !isScheduled && (isWithinDateRange || hasFinalScores);
        })
            .sort((a, b) => {
                // Sort by most recent first (by date, or by status if no date)
                const dateA = a.date ? new Date(a.date).getTime() : 0;
                const dateB = b.date ? new Date(b.date).getTime() : 0;
                if (dateA !== dateB) {
                    return dateB - dateA;
                }
                // If same date or no date, prioritize matches with scores
                const aHasScores = a.score && a.score.length > 0;
                const bHasScores = b.score && b.score.length > 0;
                return bHasScores - aHasScores;
            });

        // Get most recent completed matches (top 6) - shown when no live matches
        const mostRecentMatches = completedMatches.slice(0, 6);

        // Organize by leagues with priority: Live first, then recent completed
        const leagueData = {};
        const currentSport = selectedSport === 'all' ? null : selectedSport;

        // Get leagues for current sport or all sports
        const leaguesToProcess = currentSport
            ? SPORT_LEAGUES[currentSport] || []
            : Object.values(SPORT_LEAGUES).flat();

        // If a specific league is selected, only process that league
        const leaguesToShow = selectedLeague
            ? [selectedLeague]
            : leaguesToProcess;

        leaguesToShow.forEach(leagueName => {
            const leagueLower = leagueName.toLowerCase();
            const leagueNoSpace = leagueName.toLowerCase().replace(/\s+/g, '');
            const leagueKeyWords = leagueName.toLowerCase().split(/\s+/).filter(w => w.length > 2);

            // Filter matches for this league
            const leagueLiveMatches = liveMatches.filter(match => {
                if (currentSport && match.sport !== currentSport) return false;
                const matchLeague = (match.league || '').toLowerCase();
                const matchName = (match.name || '').toLowerCase();
                const matchSeries = (match.series || '').toLowerCase();

                // Multiple matching strategies
                return matchLeague.includes(leagueLower) ||
                    matchLeague.includes(leagueNoSpace) ||
                    matchName.includes(leagueLower) ||
                    matchSeries.includes(leagueLower) ||
                    leagueKeyWords.some(keyword => matchLeague.includes(keyword) || matchName.includes(keyword));
            });

            const leagueRecentMatches = completedMatches
                .filter(match => {
                    if (currentSport && match.sport !== currentSport) return false;
                    const matchLeague = (match.league || '').toLowerCase();
                    const matchName = (match.name || '').toLowerCase();
                    const matchSeries = (match.series || '').toLowerCase();

                    return matchLeague.includes(leagueLower) ||
                        matchLeague.includes(leagueNoSpace) ||
                        matchName.includes(leagueLower) ||
                        matchSeries.includes(leagueLower) ||
                        leagueKeyWords.some(keyword => matchLeague.includes(keyword) || matchName.includes(keyword));
                })
                .sort((a, b) => new Date(b.date) - new Date(a.date))
                .slice(0, 10); // Limit to 10 recent completed matches per league

            // Always include league if it has either live or recent matches
            // If no live matches, show recent matches (up to 10 most recent)
            if (leagueLiveMatches.length > 0 || leagueRecentMatches.length > 0) {
                leagueData[leagueName] = {
                    live: leagueLiveMatches,
                    recent: leagueRecentMatches.slice(0, 5), // Limit to 5 most recent per league
                    icon: LEAGUE_ICONS[leagueName] || '🏆',
                    sport: currentSport || 'all'
                };
            }
        });

        // Organize matches by sport - include all matches (live + recent) for each sport
        const matchesBySport = {
            cricket: {
                live: liveMatches.filter(m => (m.sport || 'cricket') === 'cricket'),
                recent: completedMatches.filter(m => (m.sport || 'cricket') === 'cricket').slice(0, 5),
                all: matches.filter(m => (m.sport || 'cricket') === 'cricket')
            },
            basketball: {
                live: liveMatches.filter(m => m.sport === 'basketball'),
                recent: completedMatches.filter(m => m.sport === 'basketball').slice(0, 5),
                all: matches.filter(m => m.sport === 'basketball')
            },
            football: {
                live: liveMatches.filter(m => m.sport === 'football'),
                recent: completedMatches.filter(m => m.sport === 'football').slice(0, 5),
                all: matches.filter(m => m.sport === 'football')
            },
            hockey: {
                live: liveMatches.filter(m => m.sport === 'hockey'),
                recent: completedMatches.filter(m => m.sport === 'hockey').slice(0, 5),
                all: matches.filter(m => m.sport === 'hockey')
            }
        };

        const result = {
            live: liveMatches,
            recent: mostRecentMatches, // Most recent completed matches (shown when no live matches)
            leagues: leagueData,
            allMatches: matches, // Include all matches for debugging
            bySport: matchesBySport // Matches organized by sport
        };

        return result;
    }, [allMatches, selectedSport, selectedLeague, searchQuery, followedSports]);

    const handleMatchClick = (match) => {
        setSelectedMatch(match);
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setSelectedMatch(null);
    };

    const getMatchCount = (sport) => {
        if (sport === 'all') return allMatches.all?.length || 0;
        return allMatches[sport]?.length || 0;
    };

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <header className={`sticky top-0 z-50 bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-blue-200 transition-all duration-200 ${isScrolled ? 'shadow-md' : ''
                }`}>
                <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-4">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                        <div className="flex-1">
                            <h1
                                onClick={() => {
                                    setViewMode('home');
                                    setViewingSport(null);
                                    setSelectedSport('all');
                                    setSelectedLeague(null);
                                    setSearchQuery('');
                                }}
                                className="text-2xl sm:text-3xl font-bold text-gray-900 mb-1 cursor-pointer hover:text-blue-600 transition-colors"
                            >
                                KRIDEX
                            </h1>
                            <p className="text-xs sm:text-sm text-gray-600 flex items-center gap-2">
                                <span className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse"></span>
                                <span className="hidden sm:inline">Multi-Sport Live Scores</span>
                                <span className="sm:hidden">Live Scores</span>
                            </p>
                        </div>
                        <div className="flex items-center gap-2 sm:gap-3">
                            {isAuthenticated ? (
                                <UserMenu
                                    user={user}
                                    logout={logout}
                                    followedMatches={followedMatches}
                                    onViewFavorites={() => {
                                        setSelectedSport('followed');
                                        setViewMode('home');
                                        setViewingSport(null);
                                        setSearchQuery('');
                                    }}
                                />
                            ) : (
                                <button
                                    onClick={() => setIsAuthModalOpen(true)}
                                    className="modern-button modern-button-primary flex items-center gap-2 text-sm"
                                    aria-label="Login or Sign up"
                                >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                    </svg>
                                    <span className="hidden sm:inline">Login</span>
                                </button>
                            )}
                            <button
                                onClick={() => loadMatches(false)}
                                disabled={isRefreshing}
                                className="modern-button disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 text-sm"
                                aria-label="Refresh matches"
                            >
                                <svg className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                </svg>
                                <span className="hidden sm:inline">{isRefreshing ? 'Refreshing...' : 'Refresh'}</span>
                            </button>
                        </div>
                    </div>
                </div>
            </header>

            {/* Sport Selection */}
            <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 relative z-10">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl sm:text-2xl font-bold text-gray-900">
                        Select Sport
                    </h2>
                </div>
                <div className="flex flex-wrap gap-3 sm:gap-4 mb-6">
                    <SportCard
                        sport="all"
                        matchCount={getMatchCount('all')}
                        isSelected={selectedSport === 'all'}
                        onSelect={setSelectedSport}
                        onAuthRequired={() => setIsAuthModalOpen(true)}
                    />
                    {Object.keys(SPORT_CONFIG).map(sport => (
                        <SportCard
                            key={sport}
                            sport={sport}
                            matchCount={getMatchCount(sport)}
                            isSelected={selectedSport === sport}
                            onSelect={setSelectedSport}
                            onAuthRequired={() => setIsAuthModalOpen(true)}
                        />
                    ))}
                    {isAuthenticated && followedSports.length > 0 && (
                        <button
                            onClick={() => setSelectedSport('followed')}
                            className={`px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200 flex items-center gap-2 ${selectedSport === 'followed'
                                ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white border border-amber-600 shadow-sm'
                                : 'bg-amber-50 text-amber-700 hover:bg-amber-100 border border-amber-200'
                                }`}
                        >
                            <span className="text-lg">⭐</span>
                            <span className="hidden sm:inline">Followed</span>
                            <span className={`text-xs px-2 py-0.5 rounded-full ${selectedSport === 'followed'
                                ? 'bg-white/20 text-white'
                                : 'bg-white/50 text-amber-700'
                                }`}>
                                {followedSports.length}
                            </span>
                        </button>
                    )}
                </div>
            </div>

            {/* Search Bar */}
            <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-4 relative z-10">
                <div className="bg-white rounded-lg p-3 border border-gray-300 transition-all duration-200 focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-500/20">
                    <div className="flex items-center gap-3">
                        <svg className="w-5 h-5 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                        <input
                            type="text"
                            placeholder="Search matches, teams, leagues..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full bg-transparent text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-0 text-sm sm:text-base"
                            aria-label="Search matches"
                        />
                        {searchQuery && (
                            <button
                                onClick={() => setSearchQuery('')}
                                className="text-gray-400 hover:text-gray-600 transition-colors p-1"
                                aria-label="Clear search"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {/* League Filter - Show when a sport is selected */}
            {selectedSport !== 'all' && selectedSport !== 'followed' && SPORT_LEAGUES[selectedSport] && (
                <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-3 relative z-10">
                    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-4 border border-blue-200 shadow-sm">
                        <h3 className="text-sm font-medium text-blue-900 mb-3">
                            Filter by League
                        </h3>
                        <LeagueFilter
                            leagues={SPORT_LEAGUES[selectedSport]}
                            selectedLeague={selectedLeague}
                            onSelect={setSelectedLeague}
                            sport={selectedSport}
                        />
                    </div>
                </div>
            )}

            {/* Followed Matches Section */}
            {(selectedSport === 'all' || selectedSport === 'followed') && (
                <div className="container mx-auto px-4 sm:px-6 lg:px-8" data-section="followed">
                    <FollowedMatches
                        allMatches={allMatches}
                        onMatchClick={handleMatchClick}
                        onAuthRequired={() => setIsAuthModalOpen(true)}
                    />
                </div>
            )}

            {/* Main Content */}
            <main className="container mx-auto px-4 py-8 relative z-10">
                {/* Only show loading overlay on initial load */}
                {loading && Object.keys(allMatches).length === 0 && (
                    <div className="flex items-center justify-center py-20">
                        <div className="text-center">
                            <div className="inline-block animate-spin rounded-full h-10 w-10 border-3 border-blue-600 border-t-transparent mb-4"></div>
                            <p className="text-gray-600">Loading matches...</p>
                        </div>
                    </div>
                )}

                {/* Subtle refresh indicator - doesn't block UI */}
                {isRefreshing && !loading && (
                    <div className="fixed top-20 left-1/2 transform -translate-x-1/2 z-50 bg-blue-500 text-white px-4 py-2 rounded-lg shadow-lg flex items-center gap-2 animate-slide-down">
                        <svg className="w-4 h-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                        <span className="text-sm font-medium">Updating scores...</span>
                    </div>
                )}

                {error && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6 animate-scale-in">
                        <div className="flex items-center gap-3">
                            <svg className="w-5 h-5 text-red-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <p className="text-red-700 text-sm">{error}</p>
                        </div>
                    </div>
                )}

                {/* Sport-Specific Page View */}
                {(!loading || Object.keys(allMatches).length > 0) && !error && viewMode === 'sport' && viewingSport && organizedMatches.bySport && (
                    <div>
                        <div className="flex items-center justify-between mb-6">
                            <div className="flex items-center gap-3">
                                <button
                                    onClick={() => {
                                        setViewMode('home');
                                        setViewingSport(null);
                                        setSelectedSport('all');
                                        setSelectedLeague(null);
                                        setSearchQuery('');
                                    }}
                                    className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                                >
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                                    </svg>
                                </button>
                                <span className="text-3xl">{viewingSport === 'cricket' ? '🏏' : viewingSport === 'basketball' ? '🏀' : viewingSport === 'football' ? '⚽' : '🏒'}</span>
                                <h1 className="text-2xl sm:text-3xl font-bold capitalize">
                                    {viewingSport}
                                </h1>
                            </div>
                        </div>

                        {/* Live Matches */}
                        {organizedMatches.bySport[viewingSport].live.length > 0 && (
                            <div className="mb-8">
                                <h2 className="text-xl font-semibold mb-4 text-gray-900">🔴 Live Matches</h2>
                                <MatchSection
                                    title=""
                                    matches={organizedMatches.bySport[viewingSport].live}
                                    onMatchClick={handleMatchClick}
                                    onAuthRequired={() => setIsAuthModalOpen(true)}
                                    icon=""
                                    color="red"
                                />
                            </div>
                        )}

                        {/* Recent Matches (4 max) */}
                        {organizedMatches.bySport[viewingSport].recent.length > 0 && (
                            <div className="mb-8">
                                <h2 className="text-xl font-semibold mb-4 text-gray-900">📊 Recent Matches</h2>
                                <MatchSection
                                    title=""
                                    matches={organizedMatches.bySport[viewingSport].recent.slice(0, 5)}
                                    onMatchClick={handleMatchClick}
                                    onAuthRequired={() => setIsAuthModalOpen(true)}
                                    icon=""
                                    color="blue"
                                />
                            </div>
                        )}

                        {/* All Matches - if no live or recent, show all */}
                        {organizedMatches.bySport[viewingSport].live.length === 0 && organizedMatches.bySport[viewingSport].recent.length === 0 && organizedMatches.bySport[viewingSport].all.length > 0 && (
                            <div className="mb-8">
                                <h2 className="text-xl font-semibold mb-4 text-gray-900">All Matches</h2>
                                <MatchSection
                                    title=""
                                    matches={organizedMatches.bySport[viewingSport].all.slice(0, 20)}
                                    onMatchClick={handleMatchClick}
                                    onAuthRequired={() => setIsAuthModalOpen(true)}
                                    icon=""
                                    color="gray"
                                />
                            </div>
                        )}

                        {organizedMatches.bySport[viewingSport].live.length === 0 && organizedMatches.bySport[viewingSport].recent.length === 0 && (!organizedMatches.bySport[viewingSport].all || organizedMatches.bySport[viewingSport].all.length === 0) && (
                            <div className="text-center py-12">
                                <p className="text-gray-500 text-lg">No matches available for {viewingSport} at the moment.</p>
                            </div>
                        )}
                    </div>
                )}

                {/* Home View */}
                {(!loading || Object.keys(allMatches).length > 0) && !error && viewMode === 'home' && (
                    <>
                        {/* Search Results */}
                        {searchQuery.trim() && organizedMatches.searchResults && (
                            <MatchSection
                                title={`Search Results for "${searchQuery}"`}
                                matches={organizedMatches.searchResults}
                                onMatchClick={handleMatchClick}
                                onAuthRequired={() => setIsAuthModalOpen(true)}
                                icon="🔍"
                                color="blue"
                            />
                        )}

                        {/* Sport-Specific Sections - Hide when a league is selected */}
                        {!searchQuery.trim() && !selectedLeague && organizedMatches.bySport && (
                            <>
                                {/* Cricket Section */}
                                {(selectedSport === 'all' || selectedSport === 'cricket') &&
                                    (organizedMatches.bySport.cricket.live.length > 0 || organizedMatches.bySport.cricket.recent.length > 0 || organizedMatches.bySport.cricket.all.length > 0) && (
                                        <div className="mb-8">
                                            <div className="flex items-center justify-between mb-4">
                                                <div className="flex items-center gap-3">
                                                    <span className="text-2xl">🏏</span>
                                                    <h2 className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
                                                        Cricket
                                                    </h2>
                                                </div>
                                                <button
                                                    onClick={() => {
                                                        setViewMode('sport');
                                                        setViewingSport('cricket');
                                                    }}
                                                    className="px-4 py-2 text-sm font-medium text-green-600 bg-green-50 border border-green-200 rounded-lg hover:bg-green-100 transition-colors"
                                                >
                                                    View All →
                                                </button>
                                            </div>
                                            {organizedMatches.bySport.cricket.live.length > 0 && (
                                                <MatchSection
                                                    title="Live Matches"
                                                    matches={organizedMatches.bySport.cricket.live}
                                                    onMatchClick={handleMatchClick}
                                                    onAuthRequired={() => setIsAuthModalOpen(true)}
                                                    icon=""
                                                    color="green"
                                                />
                                            )}
                                            {organizedMatches.bySport.cricket.recent.length > 0 && (
                                                <div className="mt-4">
                                                    <h3 className="text-lg font-semibold text-gray-700 mb-2 px-1">Recent Results</h3>
                                                    <MatchSection
                                                        title=""
                                                        matches={organizedMatches.bySport.cricket.recent}
                                                        onMatchClick={handleMatchClick}
                                                        onAuthRequired={() => setIsAuthModalOpen(true)}
                                                        icon=""
                                                        color="gray"
                                                    />
                                                </div>
                                            )}
                                            {/* Show all matches if no live or recent */}
                                            {organizedMatches.bySport.cricket.live.length === 0 && organizedMatches.bySport.cricket.recent.length === 0 && organizedMatches.bySport.cricket.all.length > 0 && (
                                                <MatchSection
                                                    title=""
                                                    matches={organizedMatches.bySport.cricket.all.slice(0, 8)}
                                                    onMatchClick={handleMatchClick}
                                                    onAuthRequired={() => setIsAuthModalOpen(true)}
                                                    icon=""
                                                    color="green"
                                                />
                                            )}
                                        </div>
                                    )}

                                {/* Basketball Section */}
                                {(selectedSport === 'all' || selectedSport === 'basketball') &&
                                    (organizedMatches.bySport.basketball.live.length > 0 || organizedMatches.bySport.basketball.recent.length > 0 || organizedMatches.bySport.basketball.all.length > 0) && (
                                        <div className="mb-8">
                                            <div className="flex items-center justify-between mb-4">
                                                <div className="flex items-center gap-3">
                                                    <span className="text-2xl">🏀</span>
                                                    <h2 className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent">
                                                        Basketball
                                                    </h2>
                                                </div>
                                                <button
                                                    onClick={() => {
                                                        setViewMode('sport');
                                                        setViewingSport('basketball');
                                                    }}
                                                    className="px-4 py-2 text-sm font-medium text-orange-600 bg-orange-50 border border-orange-200 rounded-lg hover:bg-orange-100 transition-colors"
                                                >
                                                    View All →
                                                </button>
                                            </div>
                                            {organizedMatches.bySport.basketball.live.length > 0 && (
                                                <MatchSection
                                                    title=""
                                                    matches={organizedMatches.bySport.basketball.live}
                                                    onMatchClick={handleMatchClick}
                                                    onAuthRequired={() => setIsAuthModalOpen(true)}
                                                    icon=""
                                                    color="orange"
                                                />
                                            )}
                                            {organizedMatches.bySport.basketball.recent.length > 0 && (
                                                <div className="mt-4">
                                                    <h3 className="text-lg font-semibold text-gray-700 mb-2 px-1">Recent Results</h3>
                                                    <MatchSection
                                                        title=""
                                                        matches={organizedMatches.bySport.basketball.recent}
                                                        onMatchClick={handleMatchClick}
                                                        onAuthRequired={() => setIsAuthModalOpen(true)}
                                                        icon=""
                                                        color="gray"
                                                    />
                                                </div>
                                            )}
                                        </div>
                                    )}

                                {/* Football Section */}
                                {(selectedSport === 'all' || selectedSport === 'football') &&
                                    (organizedMatches.bySport.football.live.length > 0 || organizedMatches.bySport.football.recent.length > 0 || organizedMatches.bySport.football.all.length > 0) && (
                                        <div className="mb-8">
                                            <div className="flex items-center justify-between mb-4">
                                                <div className="flex items-center gap-3">
                                                    <span className="text-2xl">⚽</span>
                                                    <h2 className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">
                                                        Football
                                                    </h2>
                                                </div>
                                                <button
                                                    onClick={() => {
                                                        setViewMode('sport');
                                                        setViewingSport('football');
                                                    }}
                                                    className="px-4 py-2 text-sm font-medium text-blue-600 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 transition-colors"
                                                >
                                                    View All →
                                                </button>
                                            </div>
                                            {organizedMatches.bySport.football.live.length > 0 && (
                                                <MatchSection
                                                    title=""
                                                    matches={organizedMatches.bySport.football.live}
                                                    onMatchClick={handleMatchClick}
                                                    onAuthRequired={() => setIsAuthModalOpen(true)}
                                                    icon=""
                                                    color="blue"
                                                />
                                            )}
                                            {organizedMatches.bySport.football.recent.length > 0 && (
                                                <div className="mt-4">
                                                    <h3 className="text-lg font-semibold text-gray-700 mb-2 px-1">Recent Results</h3>
                                                    <MatchSection
                                                        title=""
                                                        matches={organizedMatches.bySport.football.recent}
                                                        onMatchClick={handleMatchClick}
                                                        onAuthRequired={() => setIsAuthModalOpen(true)}
                                                        icon=""
                                                        color="gray"
                                                    />
                                                </div>
                                            )}
                                        </div>
                                    )}

                                {/* Hockey Section */}
                                {(selectedSport === 'all' || selectedSport === 'hockey') &&
                                    (organizedMatches.bySport.hockey.live.length > 0 || organizedMatches.bySport.hockey.recent.length > 0 || organizedMatches.bySport.hockey.all.length > 0) && (
                                        <div className="mb-8">
                                            <div className="flex items-center justify-between mb-4">
                                                <div className="flex items-center gap-3">
                                                    <span className="text-2xl">🏒</span>
                                                    <h2 className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-gray-600 to-slate-600 bg-clip-text text-transparent">
                                                        Hockey
                                                    </h2>
                                                </div>
                                                <button
                                                    onClick={() => {
                                                        setViewMode('sport');
                                                        setViewingSport('hockey');
                                                    }}
                                                    className="px-4 py-2 text-sm font-medium text-gray-600 bg-gray-50 border border-gray-200 rounded-lg hover:bg-gray-100 transition-colors"
                                                >
                                                    View All →
                                                </button>
                                            </div>
                                            {organizedMatches.bySport.hockey.live.length > 0 && (
                                                <MatchSection
                                                    title=""
                                                    matches={organizedMatches.bySport.hockey.live}
                                                    onMatchClick={handleMatchClick}
                                                    onAuthRequired={() => setIsAuthModalOpen(true)}
                                                    icon=""
                                                    color="gray"
                                                />
                                            )}
                                            {organizedMatches.bySport.hockey.recent.length > 0 && (
                                                <div className="mt-4">
                                                    <h3 className="text-lg font-semibold text-gray-700 mb-2 px-1">Recent Results</h3>
                                                    <MatchSection
                                                        title=""
                                                        matches={organizedMatches.bySport.hockey.recent}
                                                        onMatchClick={handleMatchClick}
                                                        onAuthRequired={() => setIsAuthModalOpen(true)}
                                                        icon=""
                                                        color="gray"
                                                    />
                                                </div>
                                            )}
                                        </div>
                                    )}
                            </>
                        )}

                        {/* League-Specific Sections (shown when a specific league is selected) */}
                        {!searchQuery.trim() && selectedLeague && (
                            <div className="mb-6 mt-8">
                                <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
                                    <span>🏆</span>
                                    {selectedLeague} Matches
                                </h2>
                                {Object.keys(organizedMatches.leagues).length > 0 ? (
                                    Object.entries(organizedMatches.leagues)
                                        .filter(([leagueName]) => leagueName === selectedLeague)
                                        .sort(([a], [b]) => {
                                            // Sort by: leagues with live matches first, then by name
                                            const aHasLive = organizedMatches.leagues[a].live.length > 0;
                                            const bHasLive = organizedMatches.leagues[b].live.length > 0;
                                            if (aHasLive && !bHasLive) return -1;
                                            if (!aHasLive && bHasLive) return 1;
                                            return a.localeCompare(b);
                                        })
                                        .map(([leagueName, leagueData]) => (
                                            <LeagueSection
                                                key={leagueName}
                                                leagueName={leagueName}
                                                liveMatches={leagueData.live}
                                                recentMatches={leagueData.recent}
                                                onMatchClick={handleMatchClick}
                                                onAuthRequired={() => setIsAuthModalOpen(true)}
                                                icon={leagueData.icon}
                                                sport={leagueData.sport}
                                            />
                                        ))
                                ) : (
                                    <div className="text-center py-12">
                                        <p className="text-gray-500 text-lg">No matches found for {selectedLeague}.</p>
                                        <p className="text-gray-400 text-sm mt-2">Try selecting a different league or check back later.</p>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* No matches message */}
                        {((!searchQuery.trim() && !selectedLeague && selectedSport !== 'followed' &&
                            (!organizedMatches.allMatches || organizedMatches.allMatches.length === 0)) ||
                            (searchQuery.trim() && (!organizedMatches.searchResults || organizedMatches.searchResults.length === 0))) && (
                                (searchQuery.trim() && (!organizedMatches.searchResults || organizedMatches.searchResults.length === 0))) && (
                                <div className="text-center py-12">
                                    <div className="text-5xl mb-4">🏆</div>
                                    <p className="text-lg font-semibold text-gray-900 mb-2">
                                        {searchQuery.trim() ? 'No matches found for your search' : 'No matches available at the moment'}
                                    </p>
                                    <p className="text-gray-600 text-sm">
                                        {searchQuery.trim() ? 'Try a different search term' : 'Check back later for live matches or recent results'}
                                    </p>
                                </div>
                            )}
                    </>
                )}
            </main>

            {/* Match Detail Modal */}
            {selectedMatch && (
                <MatchDetailModal
                    match={selectedMatch}
                    isOpen={isModalOpen}
                    onClose={handleCloseModal}
                />
            )}

            {/* Auth Modal */}
            <AuthModal
                isOpen={isAuthModalOpen}
                onClose={() => setIsAuthModalOpen(false)}
            />

            {/* Scroll to Top Button */}
            {showScrollTop && (
                <button
                    onClick={scrollToTop}
                    className="fixed bottom-6 right-6 z-50 modern-button p-2.5 rounded-lg shadow-lg animate-scale-in"
                    aria-label="Scroll to top"
                >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
                    </svg>
                </button>
            )}

            {/* Footer */}
            <footer className="bg-gradient-to-r from-blue-50 to-indigo-50 mt-12 py-6 border-t border-blue-200 relative z-10">
                <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center">
                    <p className="text-xs text-gray-600">Powered by Multi-Sport APIs</p>
                    <p className="text-xs text-gray-500 mt-1">© 2024 KRIDEX - Sports Dashboard</p>
                </div>
            </footer>
        </div>
    );
}

export default App;

import React from 'react';
import CricketCard from './CricketCard';
import BasketballCard from './BasketballCard';
import FootballCard from './FootballCard';
import HockeyCard from './HockeyCard';

const LeagueSection = ({ leagueName, liveMatches, recentMatches, onMatchClick, onAuthRequired, icon, sport }) => {
    const renderMatchCard = (match) => {
        const matchSport = match.sport || sport || 'cricket';
        
        switch (matchSport) {
            case 'cricket':
                return <CricketCard key={match.id} match={match} onClick={onMatchClick} onAuthRequired={onAuthRequired} />;
            case 'basketball':
                return <BasketballCard key={match.id} match={match} onClick={onMatchClick} onAuthRequired={onAuthRequired} />;
            case 'football':
                return <FootballCard key={match.id} match={match} onClick={onMatchClick} onAuthRequired={onAuthRequired} />;
            case 'hockey':
                return <HockeyCard key={match.id} match={match} onClick={onMatchClick} onAuthRequired={onAuthRequired} />;
            default:
                return <CricketCard key={match.id} match={match} onClick={onMatchClick} onAuthRequired={onAuthRequired} />;
        }
    };

    if (liveMatches.length === 0 && recentMatches.length === 0) {
        return null;
    }

    return (
        <div className="mb-6">
            <div className="flex flex-wrap items-center gap-3 mb-4">
                {icon && <span className="text-lg">{icon}</span>}
                <h3 className="text-lg sm:text-xl font-semibold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">{leagueName}</h3>
                <span className="px-2 py-1 text-xs font-medium rounded bg-indigo-100 text-indigo-700 border border-indigo-200">
                    {liveMatches.length + recentMatches.length} matches
                </span>
            </div>

            {/* Priority 1: Live Matches for this League */}
            {liveMatches.length > 0 && (
                <div className="mb-6">
                    <div className="flex flex-wrap items-center gap-2 mb-3">
                        <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
                        <h4 className="text-sm font-semibold text-red-600">Live Matches</h4>
                        <span className="px-2 py-0.5 bg-red-100 text-red-700 text-xs font-medium rounded border border-red-200">
                            {liveMatches.length}
                        </span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                        {liveMatches.map((match, index) => (
                            <div key={match.id} className="stagger-item" style={{ animationDelay: `${index * 0.05}s` }}>
                                {renderMatchCard(match)}
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Priority 2: Recent Completed Matches for this League */}
            {recentMatches.length > 0 && (
                <div className="mt-4">
                    <div className="flex flex-wrap items-center gap-2 mb-3">
                        <span className="text-sm font-semibold text-gray-600">Recent Results</span>
                        <span className="px-2 py-0.5 bg-slate-100 text-slate-700 text-xs font-medium rounded border border-slate-200">
                            {recentMatches.length}
                        </span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                        {recentMatches.map((match, index) => (
                            <div key={match.id} className="stagger-item" style={{ animationDelay: `${index * 0.05}s` }}>
                                {renderMatchCard(match)}
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export default LeagueSection;

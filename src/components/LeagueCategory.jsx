import React from 'react';
import CricketCard from './CricketCard';
import BasketballCard from './BasketballCard';
import FootballCard from './FootballCard';
import HockeyCard from './HockeyCard';

const LeagueCategory = ({ leagueName, matches, onMatchClick, icon }) => {
    const renderMatchCard = (match) => {
        const sport = match.sport || 'cricket';
        
        switch (sport) {
            case 'cricket':
                return <CricketCard key={match.id} match={match} onClick={onMatchClick} />;
            case 'basketball':
                return <BasketballCard key={match.id} match={match} onClick={onMatchClick} />;
            case 'football':
                return <FootballCard key={match.id} match={match} onClick={onMatchClick} />;
            case 'hockey':
                return <HockeyCard key={match.id} match={match} onClick={onMatchClick} />;
            default:
                return <CricketCard key={match.id} match={match} onClick={onMatchClick} />;
        }
    };

    if (!matches || matches.length === 0) {
        return null;
    }

    return (
        <div className="mb-8">
            <div className="flex items-center gap-3 mb-4">
                {icon && <span className="text-2xl">{icon}</span>}
                <h3 className="text-xl font-bold text-gray-800">{leagueName}</h3>
                <span className="px-3 py-1 bg-gray-100 text-gray-600 text-sm font-semibold rounded-full">
                    {matches.length} matches
                </span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {matches.map(match => renderMatchCard(match))}
            </div>
        </div>
    );
};

export default LeagueCategory;

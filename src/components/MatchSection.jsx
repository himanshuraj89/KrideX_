import React from 'react';
import CricketCard from './CricketCard';
import BasketballCard from './BasketballCard';
import FootballCard from './FootballCard';
import HockeyCard from './HockeyCard';

const MatchSection = ({ title, matches, onMatchClick, onAuthRequired, icon, color = 'blue' }) => {
    const renderMatchCard = (match) => {
        const sport = match.sport || 'cricket';
        
        switch (sport) {
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

    if (!matches || matches.length === 0) {
        return null;
    }

    const colorClasses = {
        red: 'from-red-500 to-pink-600',
        green: 'from-green-500 to-emerald-600',
        blue: 'from-blue-500 to-cyan-600',
        orange: 'from-orange-500 to-red-600',
        purple: 'from-purple-500 to-indigo-600'
    };

    return (
        <div className="mb-8">
            {title && (
                <div className="flex flex-wrap items-center gap-3 mb-6">
                    {icon && <span className="text-xl">{icon}</span>}
                    <h2 className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                        {title}
                    </h2>
                    <span className="px-3 py-1 text-sm font-semibold rounded-full bg-blue-100 text-blue-700 border border-blue-200">
                        {matches.length}
                    </span>
                </div>
            )}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {matches.map((match, index) => (
                    <div key={match.id || index} className="stagger-item" style={{ animationDelay: `${index * 0.05}s` }}>
                        {renderMatchCard(match)}
                    </div>
                ))}
            </div>
        </div>
    );
};

export default MatchSection;

import React from 'react';
import { useFollow } from '../contexts/FollowContext';
import { useAuth } from '../contexts/AuthContext';
import { SPORT_CONFIG } from '../services/multiSportApi';

const SportCard = ({ sport, matchCount, isSelected, onSelect, onAuthRequired }) => {
    const { isSportFollowed, toggleFollowSport } = useFollow();
    const { isAuthenticated } = useAuth();
    const config = SPORT_CONFIG[sport] || { name: 'All Sports', icon: '🏆', color: 'from-blue-500 to-indigo-600' };
    const isFollowed = sport !== 'all' && isSportFollowed(sport);

    const handleFollowClick = (e) => {
        e.stopPropagation();
        if (sport === 'all') return; // Can't follow "all"
        if (!isAuthenticated) {
            onAuthRequired && onAuthRequired();
            return;
        }
        toggleFollowSport(sport);
    };

    const handleCardClick = () => {
        onSelect && onSelect(sport);
    };

    return (
        <div className="relative group">
            <div
                onClick={handleCardClick}
                className={`relative w-full px-5 py-4 rounded-xl text-sm font-semibold transition-all duration-200 flex items-center justify-between gap-3 shadow-md cursor-pointer ${
                    isSelected 
                        ? `bg-gradient-to-r ${config.color} text-white border-2 border-transparent shadow-lg` 
                        : 'bg-white text-gray-700 hover:bg-gray-50 border-2 border-gray-200 hover:border-gray-300 hover:shadow-lg'
                }`}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        handleCardClick();
                    }
                }}
                aria-label={`Select ${config.name} sport`}
            >
                <div className="flex items-center gap-3 flex-1 min-w-0">
                    <span className="text-2xl flex-shrink-0">{config.icon}</span>
                    <span className="font-bold text-base">{config.name}</span>
                    <span className={`text-xs px-2.5 py-1 rounded-full font-bold ${
                        isSelected 
                            ? 'bg-white/30 text-white' 
                            : 'bg-blue-100 text-blue-700'
                    }`}>
                        {matchCount || 0}
                    </span>
                </div>
                
                {/* Follow Button - Always visible when authenticated and not "all" */}
                {isAuthenticated && sport !== 'all' && (
                    <button
                        type="button"
                        onClick={handleFollowClick}
                        onMouseDown={(e) => e.stopPropagation()}
                        className={`p-2 rounded-lg transition-all z-10 flex-shrink-0 ${
                            isFollowed
                                ? 'text-red-500 bg-red-50 hover:bg-red-100'
                                : 'text-gray-400 hover:text-red-500 hover:bg-gray-100'
                        } ${isSelected ? 'bg-white/20 hover:bg-white/30' : ''}`}
                        title={isFollowed ? 'Unfollow sport' : 'Follow sport'}
                        aria-label={isFollowed ? 'Unfollow sport' : 'Follow sport'}
                    >
                        <svg className="w-5 h-5" fill={isFollowed ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                        </svg>
                    </button>
                )}
            </div>
            
            {/* Follow indicator badge - visible when followed but not authenticated or when not selected */}
            {!isAuthenticated && isFollowed && (
                <div className="absolute -top-1 -right-1 z-20">
                    <div className="bg-red-500 text-white rounded-full p-1">
                        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                        </svg>
                    </div>
                </div>
            )}
        </div>
    );
};

export default SportCard;

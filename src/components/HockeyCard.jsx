import React from 'react';
import { useFollow } from '../contexts/FollowContext';
import { useAuth } from '../contexts/AuthContext';

const HockeyCard = ({ match, onClick, onAuthRequired }) => {
    const { isMatchFollowed, toggleFollowMatch } = useFollow();
    const { isAuthenticated } = useAuth();
    const isFollowed = isMatchFollowed(match.id, 'hockey');
    const statusLower = match.status?.toLowerCase() || '';
    const isLive = statusLower.includes('live') ||
        statusLower.includes('in progress') ||
        statusLower.includes('period');
    const isCompleted = statusLower.includes('finished') ||
        statusLower.includes('completed') ||
        statusLower.includes('final');

    const formatDate = (dateString) => {
        if (!dateString) return '';
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const getScore = () => {
        if (!match.score || !Array.isArray(match.score)) return { score1: null, score2: null };
        const score1 = match.score[0]?.goals ?? match.score[0]?.score ?? null;
        const score2 = match.score[1]?.goals ?? match.score[1]?.score ?? null;
        return { score1, score2 };
    };

    const team1 = match.teams?.[0] || 'Team 1';
    const team2 = match.teams?.[1] || 'Team 2';
    const { score1, score2 } = getScore();

    const handleFollowClick = (e) => {
        e.stopPropagation();
        if (!isAuthenticated) {
            onAuthRequired && onAuthRequired();
            return;
        }
        toggleFollowMatch(match.id, 'hockey');
    };

    return (
        <div
            className={`modern-card card-hover p-5 cursor-pointer min-h-[300px] flex flex-col ${isLive ? 'border-l-4 border-l-red-500 ring-2 ring-red-100' : ''
                } ${isCompleted ? 'opacity-90' : ''}`}
            onClick={() => onClick && onClick(match)}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    onClick && onClick(match);
                }
            }}
            aria-label={`${team1} vs ${team2} match`}
        >
            {/* Header */}
            <div className="flex items-start justify-between mb-4">
                <div className="flex-1 min-w-0">
                    {/* League Badge */}
                    <div className="mb-2">
                        <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                            {match.league || 'NHL'}
                        </span>
                    </div>
                    {/* Live badge and Match Name */}
                    <div className="flex items-center gap-2 mb-2 flex-wrap">
                        {isLive && (
                            <span className="px-2.5 py-1 bg-red-500 text-white text-xs font-bold rounded-full flex items-center gap-1.5">
                                <span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse"></span>
                                LIVE {match.matchTime ? `• ${match.matchTime}` : ''}
                            </span>
                        )}
                        {isCompleted && (
                            <span className="px-2.5 py-1 bg-gray-500 text-white text-xs font-semibold rounded-full">
                                COMPLETED
                            </span>
                        )}
                        {match.name && (
                            <h3 className="text-base font-bold text-gray-900 line-clamp-2 flex-1">
                                {match.name}
                            </h3>
                        )}
                    </div>
                    {/* Date and Time */}
                    {match.date && (
                        <div className="mb-2 flex items-center gap-1.5">
                            <svg className="w-3.5 h-3.5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <span className="text-xs text-gray-500">
                                {formatDate(match.date)}
                            </span>
                        </div>
                    )}
                    {/* Venue */}
                    {match.venue && match.venue !== 'TBD' && (
                        <div className="flex items-center gap-1.5">
                            <svg className="w-3.5 h-3.5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                            <span className="text-xs text-gray-500 truncate">{match.venue}</span>
                        </div>
                    )}
                </div>
                <button
                    onClick={handleFollowClick}
                    className={`p-2 rounded-lg transition-all z-10 flex-shrink-0 hover:bg-gray-100 ${isFollowed
                        ? 'text-red-500'
                        : 'text-gray-400 hover:text-gray-600'
                        }`}
                    title={isAuthenticated
                        ? (isFollowed ? 'Unfollow match' : 'Follow match')
                        : 'Login to follow matches'
                    }
                >
                    <svg className="w-5 h-5" fill={isFollowed ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                    </svg>
                </button>
            </div>

            {/* Teams and Scores */}
            <div className="space-y-3 flex-1 flex flex-col justify-center">
                {/* Team 1 */}
                <div className="flex items-center justify-between p-3 bg-gradient-to-r from-slate-50 to-gray-50 rounded-xl border border-slate-200 hover:border-slate-300 transition-colors">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                        <p className="font-bold text-gray-900 text-base truncate">{team1}</p>
                    </div>
                    {score1 !== null && score1 !== undefined && (
                        <span className="text-2xl font-extrabold text-slate-700 ml-3 whitespace-nowrap">
                            {score1}
                        </span>
                    )}
                    {score1 === null && (
                        <span className="text-sm text-gray-400 ml-3">-</span>
                    )}
                </div>

                {/* VS Divider */}
                <div className="flex items-center justify-center py-1">
                    <span className="text-xs font-bold text-gray-400">VS</span>
                </div>

                {/* Team 2 */}
                <div className="flex items-center justify-between p-3 bg-gradient-to-r from-slate-50 to-gray-50 rounded-xl border border-slate-200 hover:border-slate-300 transition-colors">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                        <p className="font-bold text-gray-900 text-base truncate">{team2}</p>
                    </div>
                    {score2 !== null && score2 !== undefined && (
                        <span className="text-2xl font-extrabold text-slate-700 ml-3 whitespace-nowrap">
                            {score2}
                        </span>
                    )}
                    {score2 === null && (
                        <span className="text-sm text-gray-400 ml-3">-</span>
                    )}
                </div>
            </div>

            {/* Status Footer */}
            {match.status && !isLive && (
                <div className="mt-4 pt-3 border-t border-gray-200">
                    <span className="text-xs text-gray-500 font-medium">{match.status}</span>
                </div>
            )}

        </div>
    );
};

export default HockeyCard;


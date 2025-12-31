import React, { useState, useEffect } from 'react';
import { API_CONFIG } from '../config/apiConfig';
import { getTeamFlag } from '../utils/flags';
import { fetchMatchScorecard } from '../services/api';

const MatchDetailModal = ({ match, isOpen, onClose }) => {
    const [scorecard, setScorecard] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (isOpen && match?.id) {
            loadScorecard();
        } else {
            // Reset state when modal closes
            setScorecard(null);
            setError(null);
            setLoading(false);
        }
    }, [isOpen, match?.id]);

    const loadScorecard = async () => {
        try {
            setLoading(true);
            setError(null);
            setScorecard(null);

            // Only fetch detailed scorecard for cricket (other sports may not have detailed scorecard API)
            if (match.sport === 'cricket' && match.id) {
                // Pass match status for caching optimization
                const data = await fetchMatchScorecard(match.id, match.status);
                setScorecard(data);
            } else {
                // For other sports, we'll show the match data we already have
                setScorecard(null);
                setLoading(false);
            }
        } catch (err) {
            console.error('Error loading scorecard:', err);
            const errorMessage = err.message || 'Failed to load match scorecard. API limit may be exceeded.';
            setError(errorMessage);
            // Don't set scorecard to null on error - we'll show fallback content
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    if (!match) {
        return (
            <div className="fixed inset-0 z-50 overflow-y-auto" onClick={onClose}>
                <div className="flex items-center justify-center min-h-screen px-4">
                    <div className="bg-white rounded-lg p-6 max-w-md w-full shadow-xl" onClick={(e) => e.stopPropagation()}>
                        <p className="text-gray-800 mb-4">No match data available.</p>
                        <button onClick={onClose} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                            Close
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        try {
            const date = new Date(dateString);
            return date.toLocaleString('en-US', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });
        } catch {
            return dateString;
        }
    };

    const getTeams = () => {
        if (match?.teams && Array.isArray(match.teams) && match.teams.length >= 2) {
            return {
                team1: match.teams[0],
                team2: match.teams[1],
                flag1: getTeamFlag(match.teams[0]),
                flag2: getTeamFlag(match.teams[1])
            };
        }
        return { team1: 'Team 1', team2: 'Team 2', flag1: '🏏', flag2: '🏏' };
    };

    const { team1, team2, flag1, flag2 } = getTeams();
    const status = match?.status?.toLowerCase() || '';
    const isLive = status.includes('live') || status.includes('in progress') || status.includes('ongoing');

    return (
        <div className="fixed inset-0 z-50 overflow-y-auto" onClick={onClose}>
            <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
                {/* Background overlay */}
                <div className="fixed inset-0 transition-opacity bg-gray-900 bg-opacity-75" onClick={onClose}></div>

                {/* Modal panel */}
                <div
                    className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-6xl sm:w-full"
                    onClick={(e) => e.stopPropagation()}
                >
                    {/* Header */}
                    <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-5">
                        <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-3 flex-wrap">
                                <span className="text-3xl">{flag1}</span>
                                <span className="text-white font-bold text-xl">{team1}</span>
                                <span className="text-blue-200 text-lg font-semibold">vs</span>
                                <span className="text-white font-bold text-xl">{team2}</span>
                                <span className="text-3xl">{flag2}</span>
                                {isLive && (
                                    <span className="flex items-center gap-1.5 px-3 py-1 bg-red-500 text-white text-xs font-bold rounded-full animate-pulse">
                                        <span className="w-2 h-2 bg-white rounded-full"></span>
                                        LIVE
                                    </span>
                                )}
                            </div>
                            <button
                                onClick={onClose}
                                className="text-white hover:text-gray-200 transition-colors p-1"
                            >
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>
                        {match?.name && (
                            <p className="text-blue-100 text-sm">{match.name}</p>
                        )}
                    </div>

                    {/* Content */}
                    <div className="bg-gray-50 px-6 py-6 max-h-[85vh] overflow-y-auto">
                        {loading && (
                            <div className="flex items-center justify-center py-20">
                                <div className="text-center">
                                    <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-blue-600 border-t-transparent mb-4"></div>
                                    <p className="text-gray-600">Loading scorecard...</p>
                                </div>
                            </div>
                        )}

                        {error && !loading && (
                            <div className="bg-red-50 border-2 border-red-200 rounded-lg p-4 mb-6">
                                <div className="flex items-center gap-2 mb-2">
                                    <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                    <p className="text-red-800 font-semibold">Error loading scorecard</p>
                                </div>
                                <p className="text-red-600 text-sm">{error}</p>
                                <p className="text-red-600 text-sm mt-2">Showing available match information below.</p>
                            </div>
                        )}

                        {/* Match Info Cards */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                            <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
                                <p className="text-xs text-gray-500 mb-1 uppercase tracking-wide">Date & Time</p>
                                <p className="font-bold text-gray-900 text-sm">
                                    {formatDate(match?.date)}
                                </p>
                            </div>
                            {match?.venue && (
                                <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
                                    <p className="text-xs text-gray-500 mb-1 uppercase tracking-wide">Venue</p>
                                    <p className="font-bold text-gray-900 text-sm">{match.venue}</p>
                                </div>
                            )}
                            {match?.status && (
                                <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
                                    <p className="text-xs text-gray-500 mb-1 uppercase tracking-wide">Status</p>
                                    <p className={`font-bold text-sm ${isLive ? 'text-red-600' : 'text-gray-900'}`}>
                                        {match.status}
                                    </p>
                                </div>
                            )}
                            {match?.matchType && (
                                <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
                                    <p className="text-xs text-gray-500 mb-1 uppercase tracking-wide">Format</p>
                                    <p className="font-bold text-gray-900 text-sm uppercase">{match.matchType}</p>
                                </div>
                            )}
                        </div>

                        {/* Score Summary */}
                        {match?.score && Array.isArray(match.score) && match.score.length > 0 && (
                            <div className="mb-6">
                                <h3 className="text-xl font-bold text-gray-900 mb-4 border-b-2 border-blue-600 pb-2">Score Summary</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {match.score.map((score, index) => {
                                        if (!score || typeof score !== 'object') return null;
                                        const teamName = index === 0 ? team1 : team2;
                                        const teamFlag = index === 0 ? flag1 : flag2;
                                        const sport = match.sport || 'cricket';

                                        // Different score formats for different sports
                                        let scoreDisplay = null;
                                        let scoreLabel = 'Score';

                                        if (sport === 'cricket') {
                                            const inning = score.inning || `Inning ${index + 1}`;
                                            scoreDisplay = score.r !== undefined && score.w !== undefined && score.o !== undefined
                                                ? `${score.r}/${score.w} (${score.o} overs)`
                                                : score.r ?? null;
                                            scoreLabel = 'Total Runs';
                                        } else if (sport === 'basketball') {
                                            scoreDisplay = score.points ?? score.score;
                                            scoreLabel = 'Points';
                                        } else if (sport === 'football' || sport === 'hockey') {
                                            scoreDisplay = score.goals ?? score.score;
                                            scoreLabel = 'Goals';
                                        } else {
                                            scoreDisplay = score.score ?? score.points ?? score.goals ?? score.r;
                                        }

                                        return (
                                            <div key={index} className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-5 border-2 border-blue-200 shadow-md">
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center gap-3">
                                                        <span className="text-3xl">{teamFlag}</span>
                                                        <div>
                                                            <p className="font-bold text-gray-900 text-lg">{teamName}</p>
                                                            {sport === 'cricket' && score.inning && (
                                                                <p className="text-xs text-gray-600 mt-1">{score.inning}</p>
                                                            )}
                                                        </div>
                                                    </div>
                                                    {scoreDisplay !== null && scoreDisplay !== undefined && (
                                                        <div className="text-right">
                                                            <p className="text-4xl font-extrabold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                                                                {scoreDisplay}
                                                            </p>
                                                            <p className="text-xs text-gray-600 mt-1 font-medium">{scoreLabel}</p>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        )}



                        {/* Basketball Match Details */}
                        {!scorecard && !loading && !error && match.sport === 'basketball' && (
                            <div className="space-y-6">
                                <h3 className="text-2xl font-bold text-gray-900 border-b-2 border-orange-600 pb-3">Match Details</h3>

                                {/* Quarter Scores */}
                                {match?.score && Array.isArray(match.score) && match.score.length >= 2 && (
                                    <div className="bg-white rounded-xl shadow-lg p-6 border border-orange-200">
                                        <h4 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                                            <span className="text-orange-600">🏀</span>
                                            Quarter-by-Quarter Scores
                                        </h4>
                                        <div className="overflow-x-auto">
                                            <table className="min-w-full divide-y divide-gray-200">
                                                <thead className="bg-gradient-to-r from-orange-600 to-red-600">
                                                    <tr>
                                                        <th className="px-4 py-3 text-left text-xs font-bold text-white uppercase">Team</th>
                                                        <th className="px-4 py-3 text-center text-xs font-bold text-white uppercase">Q1</th>
                                                        <th className="px-4 py-3 text-center text-xs font-bold text-white uppercase">Q2</th>
                                                        <th className="px-4 py-3 text-center text-xs font-bold text-white uppercase">Q3</th>
                                                        <th className="px-4 py-3 text-center text-xs font-bold text-white uppercase">Q4</th>
                                                        <th className="px-4 py-3 text-center text-xs font-bold text-white uppercase">Total</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="bg-white divide-y divide-gray-200">
                                                    {match.score.map((score, idx) => (
                                                        <tr key={idx} className="hover:bg-orange-50 transition-colors">
                                                            <td className="px-4 py-3 text-sm font-semibold text-gray-900">
                                                                {score.team || (idx === 0 ? team1 : team2)}
                                                            </td>
                                                            <td className="px-4 py-3 text-sm text-center text-gray-700 font-medium">
                                                                {score.q1 ?? '-'}
                                                            </td>
                                                            <td className="px-4 py-3 text-sm text-center text-gray-700 font-medium">
                                                                {score.q2 ?? '-'}
                                                            </td>
                                                            <td className="px-4 py-3 text-sm text-center text-gray-700 font-medium">
                                                                {score.q3 ?? '-'}
                                                            </td>
                                                            <td className="px-4 py-3 text-sm text-center text-gray-700 font-medium">
                                                                {score.q4 ?? '-'}
                                                            </td>
                                                            <td className="px-4 py-3 text-sm text-center text-gray-900 font-bold text-lg">
                                                                {score.points ?? '-'}
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Football Match Details */}
                        {!scorecard && !loading && !error && match.sport === 'football' && (
                            <div className="space-y-6">
                                <h3 className="text-2xl font-bold text-gray-900 border-b-2 border-cyan-600 pb-3">Match Details</h3>

                                {/* Score Breakdown */}
                                {match?.score && Array.isArray(match.score) && match.score.length >= 2 && (
                                    <div className="bg-white rounded-xl shadow-lg p-6 border border-cyan-200">
                                        <h4 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                                            <span className="text-cyan-600">⚽</span>
                                            Score Breakdown
                                        </h4>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            {match.score.map((score, idx) => (
                                                <div key={idx} className="bg-gradient-to-br from-cyan-50 to-blue-50 rounded-xl p-5 border-2 border-cyan-200">
                                                    <div className="flex items-center justify-between">
                                                        <div>
                                                            <p className="font-bold text-gray-900 text-lg mb-2">
                                                                {score.team || (idx === 0 ? team1 : team2)}
                                                            </p>
                                                            <div className="space-y-1">
                                                                <div className="flex items-center gap-3">
                                                                    <span className="text-sm text-gray-600">Half-time:</span>
                                                                    <span className="font-semibold text-gray-900">
                                                                        {score.halftime ?? '-'}
                                                                    </span>
                                                                </div>
                                                                <div className="flex items-center gap-3">
                                                                    <span className="text-sm text-gray-600">Full-time:</span>
                                                                    <span className="font-bold text-cyan-700 text-xl">
                                                                        {score.goals ?? '-'}
                                                                    </span>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Hockey Match Details */}
                        {!scorecard && !loading && !error && match.sport === 'hockey' && (
                            <div className="space-y-6">
                                <h3 className="text-2xl font-bold text-gray-900 border-b-2 border-slate-600 pb-3">Match Details</h3>

                                {/* Period Scores */}
                                {match?.score && Array.isArray(match.score) && match.score.length >= 2 && (
                                    <div className="bg-white rounded-xl shadow-lg p-6 border border-slate-200">
                                        <h4 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                                            <span className="text-slate-600">🏒</span>
                                            Period-by-Period Scores
                                        </h4>
                                        <div className="overflow-x-auto">
                                            <table className="min-w-full divide-y divide-gray-200">
                                                <thead className="bg-gradient-to-r from-slate-600 to-gray-600">
                                                    <tr>
                                                        <th className="px-4 py-3 text-left text-xs font-bold text-white uppercase">Team</th>
                                                        <th className="px-4 py-3 text-center text-xs font-bold text-white uppercase">1st</th>
                                                        <th className="px-4 py-3 text-center text-xs font-bold text-white uppercase">2nd</th>
                                                        <th className="px-4 py-3 text-center text-xs font-bold text-white uppercase">3rd</th>
                                                        <th className="px-4 py-3 text-center text-xs font-bold text-white uppercase">4th</th>
                                                        <th className="px-4 py-3 text-center text-xs font-bold text-white uppercase">Total</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="bg-white divide-y divide-gray-200">
                                                    {match.score.map((score, idx) => (
                                                        <tr key={idx} className="hover:bg-slate-50 transition-colors">
                                                            <td className="px-4 py-3 text-sm font-semibold text-gray-900">
                                                                {score.team || (idx === 0 ? team1 : team2)}
                                                            </td>
                                                            <td className="px-4 py-3 text-sm text-center text-gray-700 font-medium">
                                                                {score.period1 ?? '-'}
                                                            </td>
                                                            <td className="px-4 py-3 text-sm text-center text-gray-700 font-medium">
                                                                {score.period2 ?? '-'}
                                                            </td>
                                                            <td className="px-4 py-3 text-sm text-center text-gray-700 font-medium">
                                                                {score.period3 ?? '-'}
                                                            </td>
                                                            <td className="px-4 py-3 text-sm text-center text-gray-700 font-medium">
                                                                {score.period4 ?? '-'}
                                                            </td>
                                                            <td className="px-4 py-3 text-sm text-center text-gray-900 font-bold text-lg">
                                                                {score.goals ?? '-'}
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Cricket: Fallback for when scorecard not available */}
                        {!scorecard && !loading && !error && match.sport === 'cricket' && (
                            <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-6">
                                <div className="flex items-center gap-3 mb-4">
                                    <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                    <p className="text-blue-800 font-semibold">Detailed scorecard not available</p>
                                </div>
                                <p className="text-blue-700 text-sm mb-4">
                                    The scorecard API may not have data for this match, or the API limit has been reached.
                                </p>
                                {match?.score && Array.isArray(match.score) && match.score.length > 0 && (
                                    <div className="space-y-3">
                                        <p className="text-sm font-semibold text-gray-700">Match Scores:</p>
                                        {match.score.map((score, idx) => {
                                            let scoreText = `${score.r || 0}/${score.w || 0} (${score.o || 0} overs)`;
                                            return (
                                                <div key={idx} className="bg-white rounded-lg p-3 border border-blue-200">
                                                    <p className="text-sm text-gray-800">
                                                        <span className="font-semibold">{idx === 0 ? team1 : team2}:</span> {scoreText}
                                                    </p>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Show error message with helpful info */}
                        {error && !scorecard && !loading && (
                            <div className="bg-red-50 border-2 border-red-200 rounded-lg p-6">
                                <div className="flex items-center gap-3 mb-4">
                                    <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                    <p className="text-red-800 font-semibold">Error Loading Scorecard</p>
                                </div>
                                <p className="text-red-700 text-sm mb-4">{error}</p>
                                <p className="text-red-600 text-sm mb-4">Common reasons:</p>
                                <ul className="text-red-600 text-sm list-disc list-inside mb-4 space-y-1">
                                    <li>API daily limit exceeded (100 requests/day)</li>
                                    <li>Match scorecard data not available for this match</li>
                                    <li>Network connection issue</li>
                                </ul>
                                {match?.score && Array.isArray(match.score) && match.score.length > 0 && (
                                    <div className="space-y-3 mt-4">
                                        <p className="text-sm font-semibold text-gray-700">Available Match Scores:</p>
                                        {match.score.map((score, idx) => {
                                            const sport = match.sport || 'cricket';
                                            let scoreText = '';

                                            if (sport === 'cricket') {
                                                scoreText = `${score.r || 0}/${score.w || 0} (${score.o || 0} overs)`;
                                            } else if (sport === 'basketball') {
                                                scoreText = `${score.points ?? score.score ?? 0} points`;
                                            } else if (sport === 'football' || sport === 'hockey') {
                                                scoreText = `${score.goals ?? score.score ?? 0} goals`;
                                            } else {
                                                scoreText = score.score ?? score.points ?? score.goals ?? score.r ?? '0';
                                            }

                                            return (
                                                <div key={idx} className="bg-white rounded-lg p-3 border border-red-200">
                                                    <p className="text-sm text-gray-800">
                                                        <span className="font-semibold">{idx === 0 ? team1 : team2}:</span> {scoreText}
                                                    </p>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Footer */}
                    <div className="bg-gray-50 px-6 py-4 flex justify-between items-center border-t border-gray-200">
                        <p className="text-xs text-gray-500">Match ID: {match?.id || 'N/A'}</p>
                        <button
                            onClick={onClose}
                            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold shadow-md"
                        >
                            Close
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default MatchDetailModal;

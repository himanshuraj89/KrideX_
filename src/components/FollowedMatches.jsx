import React, { useState, useEffect } from 'react';
import { useFollow } from '../contexts/FollowContext';
import { useAuth } from '../contexts/AuthContext';
import CricketCard from './CricketCard';
import BasketballCard from './BasketballCard';
import FootballCard from './FootballCard';
import HockeyCard from './HockeyCard';
import { SPORT_CONFIG } from '../services/multiSportApi';

const FollowedMatches = ({ allMatches, onMatchClick, onAuthRequired }) => {
    const { followedMatches, followedSports } = useFollow();
    const { isAuthenticated } = useAuth();
    const [followedMatchesData, setFollowedMatchesData] = useState([]);

    // Helper to check if match has valid scores
    const isScoreAvailable = (match) => {
        if (!match || !match.score) return false;

        // Check if score array is not empty
        if (!Array.isArray(match.score) || match.score.length === 0) return false;

        // Check if any score object has valid data
        return match.score.some(s => {
            const hasPoints = s.points !== null && s.points !== undefined && s.points !== '';
            const hasGoals = s.goals !== null && s.goals !== undefined && s.goals !== '';
            const hasRuns = s.r !== null && s.r !== undefined && s.r !== '';
            const hasGenericScore = s.score !== null && s.score !== undefined && s.score !== '';

            return hasPoints || hasGoals || hasRuns || hasGenericScore;
        });
    };

    useEffect(() => {
        if (!allMatches || Object.keys(allMatches).length === 0 || followedMatches.length === 0) {
            setFollowedMatchesData([]);
            return;
        }

        // Flatten all matches from all sports
        const allMatchesFlat = Object.values(allMatches).flat();

        const matched = followedMatches
            .map(fm => {
                // Try to find match by exact ID
                let match = allMatchesFlat.find(m => m.id === fm.id);

                // If not found, try to find by sport and team names (for better matching)
                if (!match && fm.sport) {
                    const sportMatches = allMatches[fm.sport] || [];
                    // Try matching by name if available
                    if (fm.name) {
                        match = sportMatches.find(m =>
                            m.name === fm.name ||
                            (m.teams && fm.teams &&
                                m.teams.length === fm.teams.length &&
                                m.teams.every((team, idx) => team === fm.teams[idx]))
                        );
                    }
                    // Fallback to ID match within sport
                    if (!match) {
                        match = sportMatches.find(m => m.id === fm.id);
                    }
                }

                return match;
            })
            .filter(match => match && isScoreAvailable(match)); // Filter out nulls AND matches without scores

        setFollowedMatchesData(matched);
    }, [followedMatches, allMatches]);

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

    if (!isAuthenticated) {
        return (
            <div className="mb-6">
                <div className="bg-white rounded-xl p-6 sm:p-8 border border-gray-200 shadow-sm text-center">
                    <div className="text-5xl mb-4">🔒</div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-3">
                        Login Required
                    </h3>
                    <p className="text-sm text-gray-600 mb-6">
                        Sign in to follow your favorite sports and matches
                    </p>
                    <button
                        onClick={() => onAuthRequired && onAuthRequired()}
                        className="modern-button modern-button-primary"
                    >
                        Login / Sign Up
                    </button>
                </div>
            </div>
        );
    }

    if (followedMatches.length === 0 && followedSports.length === 0) {
        return (
            <div className="mb-6">
                <div className="bg-white rounded-xl p-6 sm:p-8 border border-gray-200 shadow-sm text-center">
                    <div className="text-5xl mb-4">⭐</div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-3">
                        No Followed Items Yet
                    </h3>
                    <p className="text-sm text-gray-600">
                        Start following sports and matches to see them here
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="mb-6">
            <div className="bg-white rounded-xl p-4 sm:p-6 border border-gray-200 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                    <div>
                        <h2 className="text-lg sm:text-xl font-semibold bg-gradient-to-r from-amber-500 to-orange-500 bg-clip-text text-transparent flex items-center gap-2">
                            <span className="text-xl">⭐</span>
                            Followed Matches & Sports
                        </h2>
                        <p className="text-xs sm:text-sm text-gray-600 mt-1">
                            {followedMatches.length} followed matches • {followedSports.length} followed sports
                        </p>
                    </div>
                </div>

                {/* Followed Sports */}
                {followedSports.length > 0 && (
                    <div className="mb-4">
                        <h3 className="text-sm font-medium text-gray-700 mb-3">Followed Sports</h3>
                        <div className="flex flex-wrap gap-2">
                            {followedSports.map(sport => {
                                const config = SPORT_CONFIG[sport];
                                if (!config) return null;
                                return (
                                    <div
                                        key={sport}
                                        className="flex items-center gap-2 px-3 py-1.5 bg-amber-50 text-amber-900 rounded-lg border border-amber-200"
                                    >
                                        <span className="text-base">{config.icon}</span>
                                        <span className="font-medium text-sm">{config.name}</span>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}

                {/* Followed Matches */}
                {followedMatchesData.length > 0 ? (
                    <div>
                        <h3 className="text-sm font-medium text-gray-700 mb-3">Followed Matches</h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                            {followedMatchesData.map((match, index) => (
                                <div key={match.id} className="stagger-item" style={{ animationDelay: `${index * 0.05}s` }}>
                                    {renderMatchCard(match)}
                                </div>
                            ))}
                        </div>
                    </div>
                ) : followedMatches.length > 0 ? (
                    <div className="text-center py-6 text-gray-600">
                        <p className="text-sm">No followed matches found in current data.</p>
                        <p className="text-xs mt-2 text-gray-500">Try refreshing to load matches.</p>
                    </div>
                ) : null}
            </div>
        </div>
    );
};

export default FollowedMatches;

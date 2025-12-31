import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { useAuth } from './AuthContext';

const FollowContext = createContext();

export const useFollow = () => {
    const context = useContext(FollowContext);
    if (!context) {
        throw new Error('useFollow must be used within a FollowProvider');
    }
    return context;
};

export const FollowProvider = ({ children }) => {
    let user, updateUser;
    try {
        const auth = useAuth();
        user = auth?.user;
        updateUser = auth?.updateUser;
    } catch (error) {
        // AuthContext not available, use localStorage only
        user = null;
        updateUser = null;
    }
    
    const [followedSports, setFollowedSports] = useState([]);
    const [followedMatches, setFollowedMatches] = useState([]);

    // Load from user data or localStorage (for backward compatibility)
    useEffect(() => {
        if (user && updateUser) {
            // Load from user data
            setFollowedSports(user.followedSports || []);
            setFollowedMatches(user.followedMatches || []);
        } else {
            // Fallback to localStorage for non-authenticated users
            const savedSports = localStorage.getItem('followedSports');
            const savedMatches = localStorage.getItem('followedMatches');
            
            if (savedSports) {
                setFollowedSports(JSON.parse(savedSports));
            }
            if (savedMatches) {
                setFollowedMatches(JSON.parse(savedMatches));
            }
        }
    }, [user, updateUser]);

    // Track if this is the initial load
    const isInitialLoad = useRef(true);

    // Reset initial load flag when user changes
    useEffect(() => {
        isInitialLoad.current = true;
    }, [user]);

    // Save to user data or localStorage
    useEffect(() => {
        // Skip save on initial load to prevent unnecessary saves
        if (isInitialLoad.current) {
            isInitialLoad.current = false;
            return;
        }

        if (user && updateUser) {
            // Save to user data
            updateUser({
                followedSports,
                followedMatches
            });
        } else {
            // Fallback to localStorage
            localStorage.setItem('followedSports', JSON.stringify(followedSports));
            localStorage.setItem('followedMatches', JSON.stringify(followedMatches));
        }
    }, [followedSports, followedMatches, user, updateUser]);

    const toggleFollowSport = (sport) => {
        setFollowedSports(prev => {
            if (prev.includes(sport)) {
                return prev.filter(s => s !== sport);
            }
            return [...prev, sport];
        });
    };

    const toggleFollowMatch = (matchId, sport) => {
        setFollowedMatches(prev => {
            const matchKey = `${sport}-${matchId}`;
            const exists = prev.find(m => m.id === matchId && m.sport === sport);
            if (exists) {
                return prev.filter(m => !(m.id === matchId && m.sport === sport));
            }
            return [...prev, { id: matchId, sport, followedAt: new Date().toISOString() }];
        });
    };

    const isSportFollowed = (sport) => {
        return followedSports.includes(sport);
    };

    const isMatchFollowed = (matchId, sport) => {
        return followedMatches.some(m => m.id === matchId && m.sport === sport);
    };

    const getFollowedMatchesForSport = (sport) => {
        return followedMatches.filter(m => m.sport === sport);
    };

    const value = {
        followedSports,
        followedMatches,
        toggleFollowSport,
        toggleFollowMatch,
        isSportFollowed,
        isMatchFollowed,
        getFollowedMatchesForSport
    };

    return (
        <FollowContext.Provider value={value}>
            {children}
        </FollowContext.Provider>
    );
};

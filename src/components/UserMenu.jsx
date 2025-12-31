import React, { useState, useRef, useEffect } from 'react';
import { useFollow } from '../contexts/FollowContext';

const UserMenu = ({ user, logout, followedMatches, onViewFavorites }) => {
    const [isOpen, setIsOpen] = useState(false);
    const menuRef = useRef(null);
    const logoutButtonRef = useRef(null);
    const { followedSports } = useFollow();

    // Close menu when clicking outside
    useEffect(() => {
        if (!isOpen) return;

        const handleClickOutside = (event) => {
            // Don't close if clicking on logout button
            if (logoutButtonRef.current && logoutButtonRef.current.contains(event.target)) {
                return;
            }

            if (menuRef.current && !menuRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isOpen]);

    const handleLogout = () => {
        setIsOpen(false);
        if (logout && typeof logout === 'function') {
            logout();
        }
    };

    const handleFavoritesClick = () => {
        setIsOpen(false);
        if (onViewFavorites) {
            onViewFavorites();
        }
    };

    return (
        <div className="relative" ref={menuRef}>
            {/* User Avatar/Name Button */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                onMouseEnter={() => setIsOpen(true)}
                className="flex items-center gap-2 px-3 py-1.5 bg-white rounded-lg border border-blue-200 shadow-sm hover:border-blue-300 hover:shadow-md transition-all duration-200 group"
                aria-label="User menu"
                aria-expanded={isOpen}
            >
                <div className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-semibold text-xs shadow-sm">
                    {user?.name?.charAt(0).toUpperCase() || 'U'}
                </div>
                <div className="hidden md:block text-left">
                    <p className="text-xs text-gray-700 font-medium">{user?.name || 'User'}</p>
                </div>
                <svg
                    className={`w-4 h-4 text-gray-500 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
            </button>

            {/* Dropdown Menu */}
            {isOpen && (
                <div
                    className="absolute right-0 mt-2 w-72 bg-white rounded-lg shadow-xl border border-blue-200 py-2 z-50 animate-scale-in"
                    onMouseEnter={() => setIsOpen(true)}
                    onMouseLeave={() => setIsOpen(false)}
                >
                    {/* User Info Section */}
                    <div className="px-4 py-3 border-b border-gray-200">
                        <p className="text-sm font-semibold text-gray-900">{user?.name || 'User'}</p>
                        <p className="text-xs text-gray-500 mt-1 truncate">{user?.email}</p>
                    </div>

                    {/* Favorite Matches Section */}
                    <div
                        className="px-4 py-3 border-b border-gray-200 cursor-pointer hover:bg-gray-50 transition-colors"
                        onClick={handleFavoritesClick}
                    >
                        <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                                <svg className="w-4 h-4 text-amber-500" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                                </svg>
                                <span className="text-sm font-medium text-gray-700">Favorite Matches</span>
                            </div>
                            <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-medium">
                                {followedMatches?.length || 0}
                            </span>
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                            {followedSports && followedSports.length > 0 ? (
                                <>
                                    {followedSports.slice(0, 3).map(sport => (
                                        <span
                                            key={sport}
                                            className="text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded border border-blue-200 capitalize"
                                        >
                                            {sport}
                                        </span>
                                    ))}
                                    {followedSports.length > 3 && (
                                        <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">
                                            +{followedSports.length - 3}
                                        </span>
                                    )}
                                </>
                            ) : followedMatches && followedMatches.length > 0 ? (
                                <span className="text-xs text-blue-600 italic">Click to view details</span>
                            ) : (
                                <span className="text-xs text-gray-400 italic">No favorites yet</span>
                            )}
                        </div>
                    </div>

                    {/* Logout Button */}
                    <div className="px-2 py-1">
                        <button
                            ref={logoutButtonRef}
                            type="button"
                            onClick={handleLogout}
                            className="w-full flex items-center gap-2 px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg transition-colors duration-200 cursor-pointer"
                            aria-label="Logout"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                            </svg>
                            <span>Logout</span>
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default UserMenu;

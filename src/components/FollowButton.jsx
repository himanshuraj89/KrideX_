import React from 'react';
import { useAuth } from '../contexts/AuthContext';

const FollowButton = ({ isFollowed, onToggle, itemType = 'item', className = '' }) => {
    const { isAuthenticated, user } = useAuth();

    const handleClick = (e) => {
        e.stopPropagation();
        
        if (!isAuthenticated) {
            // Show login prompt - this will be handled by parent component
            return;
        }
        
        onToggle();
    };

    return (
        <button
            onClick={handleClick}
            className={`absolute top-4 right-4 p-2 rounded-xl transition-all backdrop-blur-lg z-10 ${className} ${
                isFollowed
                    ? 'bg-gradient-to-r from-pink-500 to-rose-600 text-white shadow-lg shadow-pink-500/50'
                    : 'bg-slate-700/50 text-slate-300 hover:bg-slate-600/50 border border-slate-600/50'
            }`}
            title={isAuthenticated 
                ? (isFollowed ? `Unfollow ${itemType}` : `Follow ${itemType}`)
                : `Login to follow ${itemType}`
            }
            aria-label={isAuthenticated 
                ? (isFollowed ? `Unfollow ${itemType}` : `Follow ${itemType}`)
                : `Login to follow ${itemType}`
            }
        >
            <svg
                className="w-5 h-5"
                fill={isFollowed ? 'currentColor' : 'none'}
                stroke="currentColor"
                viewBox="0 0 24 24"
            >
                <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                />
            </svg>
        </button>
    );
};

export default FollowButton;

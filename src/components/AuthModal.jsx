import React, { useState, useEffect } from 'react';
import Login from './Login';
import Signup from './Signup';

const AuthModal = ({ isOpen, onClose }) => {
    const [isLogin, setIsLogin] = useState(true);

    // Prevent body scroll when modal is open
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }
        return () => {
            document.body.style.overflow = '';
        };
    }, [isOpen]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <div 
                className="fixed inset-0 bg-black/40 backdrop-blur-sm"
                onClick={onClose}
            ></div>
            
            {/* Modal Content */}
            <div 
                className="relative w-full max-w-md z-10"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Close Button */}
                <button
                    onClick={onClose}
                    className="absolute -top-12 right-0 text-white hover:text-gray-200 transition-colors p-2 z-20 bg-black/20 rounded-full backdrop-blur-sm"
                    aria-label="Close"
                >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>

                {/* Auth Form */}
                <div className="animate-scale-in">
                    {isLogin ? (
                        <Login 
                            onSwitchToSignup={() => setIsLogin(false)}
                            onClose={onClose}
                        />
                    ) : (
                        <Signup 
                            onSwitchToLogin={() => setIsLogin(true)}
                            onClose={onClose}
                        />
                    )}
                </div>
            </div>
        </div>
    );
};

export default AuthModal;

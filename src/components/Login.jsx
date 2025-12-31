import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';

const Login = ({ onSwitchToSignup, onClose }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [showForgotPassword, setShowForgotPassword] = useState(false);
    const [forgotEmail, setForgotEmail] = useState('');
    const [forgotLoading, setForgotLoading] = useState(false);
    const [forgotError, setForgotError] = useState('');
    const [forgotSuccess, setForgotSuccess] = useState(false);
    const [emailSent, setEmailSent] = useState(false); // Track if email was sent successfully
    const [verificationCode, setVerificationCode] = useState(''); // The code sent to user (for demo display only)
    const [enteredCode, setEnteredCode] = useState(''); // The code user enters
    const [showCodeInput, setShowCodeInput] = useState(false); // false = show code input, true = show password reset
    const [newPassword, setNewPassword] = useState('');
    const [confirmNewPassword, setConfirmNewPassword] = useState('');
    const [resetLoading, setResetLoading] = useState(false);
    const [resetError, setResetError] = useState('');
    const [resetSuccess, setResetSuccess] = useState(false);
    const { login, forgotPassword, verifyResetCode, resetPassword } = useAuth();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        // Basic validation
        if (!email || !password) {
            setError('Email and password are required');
            return;
        }

        setLoading(true);

        const result = await login(email, password);
        
        if (result.success) {
            onClose && onClose();
        } else {
            setError(result.error || 'Login failed. Please try again.');
        }
        
        setLoading(false);
    };

    const handleForgotPassword = async (e) => {
        e.preventDefault();
        setForgotError('');
        setForgotSuccess(false);
        setEmailSent(false);
        setShowCodeInput(false);
        setVerificationCode('');
        setNewPassword('');
        setConfirmNewPassword('');

        if (!forgotEmail) {
            setForgotError('Email is required');
            return;
        }

        setForgotLoading(true);

        const result = await forgotPassword(forgotEmail);
        
        if (result.success) {
            setForgotSuccess(true);
            // Only show code in UI if email was NOT sent (fallback/demo mode)
            if (result.emailSent === true) {
                // Email was sent successfully - don't show code in UI
                setEmailSent(true);
                setVerificationCode('');
            } else {
                // Email failed or not configured - show code as fallback
                setEmailSent(false);
                setVerificationCode(result.verificationCode || '');
            }
            setShowCodeInput(false); // Show code input form
        } else {
            setForgotError(result.error || 'Failed to send verification code. Please try again.');
        }
        
        setForgotLoading(false);
    };

    const handleVerifyCode = async (e) => {
        e.preventDefault();
        setResetError('');

        if (!enteredCode || enteredCode.length !== 6) {
            setResetError('Please enter a valid 6-digit code');
            return;
        }

        setResetLoading(true);

        const result = await verifyResetCode(forgotEmail, enteredCode);
        
        if (result.success) {
            // Code verified, show password reset form
            setShowCodeInput(true);
            setVerificationCode(enteredCode); // Store verified code for password reset
        } else {
            setResetError(result.error || 'Invalid verification code');
        }
        
        setResetLoading(false);
    };

    const handleResetPassword = async (e) => {
        e.preventDefault();
        setResetError('');

        if (!newPassword || !confirmNewPassword) {
            setResetError('Both password fields are required');
            return;
        }

        if (newPassword.length < 6) {
            setResetError('Password must be at least 6 characters long');
            return;
        }

        if (newPassword !== confirmNewPassword) {
            setResetError('Passwords do not match');
            return;
        }

        setResetLoading(true);

        const result = await resetPassword(forgotEmail, newPassword, verificationCode);
        
        if (result.success) {
            setResetSuccess(true);
            // Auto close after 2 seconds and return to login
            setTimeout(() => {
                handleBackToLogin();
            }, 2000);
        } else {
            setResetError(result.error || 'Failed to reset password. Please try again.');
        }
        
        setResetLoading(false);
    };

    const handleBackToLogin = () => {
        setShowForgotPassword(false);
        setForgotEmail('');
        setForgotError('');
        setForgotSuccess(false);
        setEmailSent(false);
        setShowCodeInput(false);
        setVerificationCode('');
        setEnteredCode('');
        setNewPassword('');
        setConfirmNewPassword('');
        setResetError('');
        setResetSuccess(false);
    };

    // Show forgot password form
    if (showForgotPassword) {
        return (
            <div className="bg-white rounded-xl p-6 sm:p-8 max-w-md w-full mx-auto border border-gray-200 shadow-lg">
                <div className="text-center mb-6">
                    <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
                        Forgot Password
                    </h2>
                    <p className="text-sm text-gray-600">
                        Enter your email to recover your password
                    </p>
                </div>

                {!forgotSuccess ? (
                    <form onSubmit={handleForgotPassword} className="space-y-4">
                        {forgotError && (
                            <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-center gap-2 animate-scale-in">
                                <svg className="w-5 h-5 text-red-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                <p className="text-sm text-red-700">{forgotError}</p>
                            </div>
                        )}

                        <div>
                            <label htmlFor="forgotEmail" className="block text-sm font-medium text-gray-700 mb-2">
                                Email Address
                            </label>
                            <input
                                id="forgotEmail"
                                type="email"
                                value={forgotEmail}
                                onChange={(e) => setForgotEmail(e.target.value)}
                                required
                                disabled={forgotSuccess}
                                className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all disabled:bg-gray-100 disabled:cursor-not-allowed"
                                placeholder="your@email.com"
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={forgotLoading || forgotSuccess}
                            className="modern-button modern-button-primary w-full disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {forgotLoading ? (
                                <span className="flex items-center justify-center gap-2">
                                    <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    Sending code...
                                </span>
                            ) : (
                                'Send Verification Code'
                            )}
                        </button>
                    </form>
                ) : !showCodeInput ? (
                    <div className="space-y-4">
                        {/* Step 1: Show success message */}
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 animate-scale-in">
                            <div className="flex items-start gap-3">
                                <svg className="w-6 h-6 text-blue-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                </svg>
                                <div className="flex-1">
                                    <p className="text-sm font-medium text-blue-800 mb-2">
                                        Verification code sent to {forgotEmail}
                                    </p>
                                    <p className="text-xs text-blue-700">
                                        Please check your email inbox (and spam folder) for the 6-digit verification code. The code expires in 5 minutes.
                                    </p>
                                    {!emailSent && verificationCode && (
                                        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mt-3">
                                            <p className="text-xs text-yellow-800 mb-1 font-semibold">⚠️ Email sending failed:</p>
                                            <p className="text-xs text-yellow-700 mb-2">Your verification code (fallback):</p>
                                            <p className="text-xl font-mono font-bold text-yellow-900 tracking-wider text-center py-1">
                                                {verificationCode}
                                            </p>
                                            <p className="text-xs text-yellow-700 mt-2">
                                                Please check your EmailJS configuration. See setup instructions in README.
                                            </p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        <form onSubmit={handleVerifyCode} className="space-y-4">
                            {resetError && (
                                <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-center gap-2 animate-scale-in">
                                    <svg className="w-5 h-5 text-red-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                    <p className="text-sm text-red-700">{resetError}</p>
                                </div>
                            )}

                            <div>
                                <label htmlFor="enteredCode" className="block text-sm font-medium text-gray-700 mb-2">
                                    Enter Verification Code
                                </label>
                                <input
                                    id="enteredCode"
                                    type="text"
                                    value={enteredCode}
                                    onChange={(e) => setEnteredCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                                    required
                                    maxLength={6}
                                    className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-center text-2xl font-mono tracking-widest"
                                    placeholder="000000"
                                />
                                <p className="text-xs text-gray-500 mt-1 text-center">Enter the 6-digit code</p>
                            </div>

                            <button
                                type="submit"
                                disabled={resetLoading || enteredCode.length !== 6}
                                className="modern-button modern-button-primary w-full disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {resetLoading ? (
                                    <span className="flex items-center justify-center gap-2">
                                        <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                        </svg>
                                        Verifying...
                                    </span>
                                ) : (
                                    'Verify Code'
                                )}
                            </button>
                        </form>
                    </div>
                ) : resetSuccess ? (
                    <div className="space-y-4">
                        <div className="bg-green-50 border border-green-200 rounded-lg p-4 animate-scale-in">
                            <div className="flex items-start gap-3">
                                <svg className="w-6 h-6 text-green-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                <div className="flex-1">
                                    <p className="text-sm font-medium text-green-800">
                                        Password reset successfully! Redirecting to login...
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                ) : (
                    <form onSubmit={handleResetPassword} className="space-y-4">
                        {resetError && (
                            <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-center gap-2 animate-scale-in">
                                <svg className="w-5 h-5 text-red-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                <p className="text-sm text-red-700">{resetError}</p>
                            </div>
                        )}

                        <div>
                            <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700 mb-2">
                                New Password
                            </label>
                            <input
                                id="newPassword"
                                type="password"
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                required
                                minLength={6}
                                className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                                placeholder="••••••••"
                            />
                            <p className="text-xs text-gray-500 mt-1">Minimum 6 characters</p>
                        </div>

                        <div>
                            <label htmlFor="confirmNewPassword" className="block text-sm font-medium text-gray-700 mb-2">
                                Confirm New Password
                            </label>
                            <input
                                id="confirmNewPassword"
                                type="password"
                                value={confirmNewPassword}
                                onChange={(e) => setConfirmNewPassword(e.target.value)}
                                required
                                minLength={6}
                                className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                                placeholder="••••••••"
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={resetLoading}
                            className="modern-button modern-button-primary w-full disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {resetLoading ? (
                                <span className="flex items-center justify-center gap-2">
                                    <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    Resetting...
                                </span>
                            ) : (
                                'Reset Password'
                            )}
                        </button>
                    </form>
                )}

                <div className="mt-6 text-center">
                    <button
                        onClick={handleBackToLogin}
                        className="text-sm text-gray-600 hover:text-gray-900 transition-colors underline"
                    >
                        ← Back to Login
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-xl p-6 sm:p-8 max-w-md w-full mx-auto border border-gray-200 shadow-lg">
            <div className="text-center mb-6">
                <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
                    Welcome Back
                </h2>
                <p className="text-sm text-gray-600">
                    Sign in to continue following your favorite sports
                </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
                {error && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-center gap-2 animate-scale-in">
                        <svg className="w-5 h-5 text-red-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <p className="text-sm text-red-700">{error}</p>
                    </div>
                )}

                <div>
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                        Email Address
                    </label>
                    <input
                        id="email"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                        placeholder="your@email.com"
                    />
                </div>

                <div>
                    <div className="flex items-center justify-between mb-2">
                        <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                            Password
                        </label>
                        <button
                            type="button"
                            onClick={() => setShowForgotPassword(true)}
                            className="text-xs text-blue-600 hover:text-blue-700 font-medium transition-colors underline"
                        >
                            Forgot password?
                        </button>
                    </div>
                    <input
                        id="password"
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                        placeholder="••••••••"
                    />
                </div>

                <button
                    type="submit"
                    disabled={loading}
                    className="modern-button modern-button-primary w-full disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {loading ? (
                        <span className="flex items-center justify-center gap-2">
                            <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            Signing in...
                        </span>
                    ) : (
                        'Sign In'
                    )}
                </button>
            </form>

            <div className="mt-6 text-center">
                <p className="text-sm text-gray-600">
                    Don't have an account?{' '}
                    <button
                        onClick={onSwitchToSignup}
                        className="text-blue-600 hover:text-blue-700 font-medium transition-colors underline"
                    >
                        Sign up
                    </button>
                </p>
            </div>
        </div>
    );
};

export default Login;

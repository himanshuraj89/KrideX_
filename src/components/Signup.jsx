import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';

const Signup = ({ onSwitchToLogin, onClose }) => {
    const [step, setStep] = useState('register'); // 'register' | 'verify'
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [verificationCode, setVerificationCode] = useState(''); // Actual code sent (for fallback)
    const [enteredCode, setEnteredCode] = useState(''); // User input
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [emailSent, setEmailSent] = useState(false);

    const { initiateSignup, completeSignup } = useAuth();

    const handleRegister = async (e) => {
        e.preventDefault();
        setError('');

        if (password !== confirmPassword) {
            setError('Passwords do not match');
            return;
        }

        setLoading(true);

        const result = await initiateSignup(email, password, name);

        setLoading(false);

        if (result.success) {
            setStep('verify');
            setEmailSent(result.emailSent);
            if (!result.emailSent && result.verificationCode) {
                setVerificationCode(result.verificationCode);
            }
        } else {
            setError(result.error);
        }
    };

    const handleVerify = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        const result = await completeSignup(email, enteredCode);

        setLoading(false);

        if (result.success) {
            onClose && onClose();
        } else {
            setError(result.error);
        }
    };

    if (step === 'verify') {
        return (
            <div className="bg-white rounded-xl p-6 sm:p-8 max-w-md w-full mx-auto border border-gray-200 shadow-lg">
                <div className="text-center mb-6">
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">Verify Email</h2>
                    <p className="text-sm text-gray-600">
                        We sent a code to <span className="font-semibold">{email}</span>
                    </p>
                </div>

                <div className="space-y-4">
                    {/* Success/Info Message */}
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 animate-scale-in">
                        <div className="flex items-start gap-3">
                            <svg className="w-6 h-6 text-blue-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                            </svg>
                            <div className="flex-1">
                                <p className="text-sm text-blue-800">
                                    Please enter the 6-digit verification code sent to your email.
                                </p>
                                {/* Fallback for Demo Mode or Email Failure */}
                                {!emailSent && verificationCode && (
                                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mt-3">
                                        <p className="text-xs text-yellow-800 mb-1 font-semibold">⚠️ Demo / Email Failed:</p>
                                        <p className="text-xl font-mono font-bold text-yellow-900 tracking-wider text-center py-1">
                                            {verificationCode}
                                        </p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    <form onSubmit={handleVerify} className="space-y-4">
                        {error && (
                            <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700">
                                {error}
                            </div>
                        )}

                        <div>
                            <input
                                type="text"
                                value={enteredCode}
                                onChange={(e) => setEnteredCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                                required
                                maxLength={6}
                                className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all text-center text-2xl font-mono tracking-widest"
                                placeholder="000000"
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={loading || enteredCode.length !== 6}
                            className="modern-button modern-button-primary w-full disabled:opacity-50"
                        >
                            {loading ? 'Verifying...' : 'Complete Sign Up'}
                        </button>
                    </form>

                    <button
                        onClick={() => setStep('register')}
                        className="w-full text-center text-sm text-gray-500 hover:text-gray-700 underline mt-2"
                    >
                        Change Email / Back
                    </button>
                </div>
            </div>
        );
    }

    // Default: Register Form
    return (
        <div className="bg-white rounded-xl p-6 sm:p-8 max-w-md w-full mx-auto border border-gray-200 shadow-lg">
            <div className="text-center mb-6">
                <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
                    Create Account
                </h2>
                <p className="text-sm text-gray-600">
                    Join KRIDEX to follow your favorite sports
                </p>
            </div>

            <form onSubmit={handleRegister} className="space-y-4">
                {error && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-center gap-2 animate-scale-in">
                        <svg className="w-5 h-5 text-red-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <p className="text-sm text-red-700">{error}</p>
                    </div>
                )}

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Full Name</label>
                    <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        required
                        className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                        placeholder="John Doe"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Email Address</label>
                    <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                        placeholder="your@email.com"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Password</label>
                    <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        minLength={6}
                        className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                        placeholder="••••••••"
                    />
                    <p className="text-xs text-gray-500 mt-1">Min. 6 characters</p>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Confirm Password</label>
                    <input
                        type="password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        required
                        className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                        placeholder="••••••••"
                    />
                </div>

                <button
                    type="submit"
                    disabled={loading}
                    className="modern-button modern-button-primary w-full disabled:opacity-50"
                >
                    {loading ? (
                        <span className="flex items-center justify-center gap-2">
                            <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            Sending Code...
                        </span>
                    ) : (
                        'Create Account'
                    )}
                </button>
            </form>

            <div className="mt-6 text-center">
                <p className="text-sm text-gray-600">
                    Already have an account?{' '}
                    <button
                        onClick={onSwitchToLogin}
                        className="text-blue-600 hover:text-blue-700 font-medium transition-colors underline"
                    >
                        Sign in
                    </button>
                </p>
            </div>
        </div>
    );
};

export default Signup;

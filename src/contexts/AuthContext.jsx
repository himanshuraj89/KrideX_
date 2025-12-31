import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext(null);

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within AuthProvider');
    }
    return context;
};

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    // Load user from localStorage on mount
    useEffect(() => {
        const storedUser = localStorage.getItem('kridex_user');
        if (storedUser) {
            try {
                setUser(JSON.parse(storedUser));
            } catch (error) {
                console.error('Error parsing user data:', error);
                localStorage.removeItem('kridex_user');
            }
        }
        setLoading(false);

        // DEBUG: Expose users to window and log to console
        const allUsers = JSON.parse(localStorage.getItem('kridex_users') || '[]');
        console.log('-------------------------------------------');
        console.log('👑 ADMIN DEBUG: All Users Data');
        console.log('To access in console use: window.getAllUsers()');
        console.log('Users List:', allUsers);
        console.log('-------------------------------------------');

        window.getAllUsers = () => {
            const users = JSON.parse(localStorage.getItem('kridex_users') || '[]');
            console.table(users);
            return users;
        };

    }, []);

    // Save user to localStorage whenever it changes
    useEffect(() => {
        if (user) {
            localStorage.setItem('kridex_user', JSON.stringify(user));
        } else {
            localStorage.removeItem('kridex_user');
        }
    }, [user]);

    // Unified error handler
    const handleError = (error) => {
        return { success: false, error: error.message || 'An unexpected error occurred' };
    };

    // Step 1: Initiate Signup - Validate and Send Code
    const initiateSignup = async (email, password, name) => {
        try {
            // Validate inputs
            if (!email || !password || !name) throw new Error('All fields are required');
            if (password.length < 6) throw new Error('Password must be at least 6 characters long');

            // Check if user already exists
            const existingUsers = JSON.parse(localStorage.getItem('kridex_users') || '[]');
            if (existingUsers.find(u => u.email === email)) {
                throw new Error('User with this email already exists');
            }

            // Generate 6-digit code
            const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();

            // Store pending signup data (expires in 10 mins)
            const pendingData = {
                email,
                name,
                password, // Note: In a real backend, verify first then send password, or hash immediately
                code: verificationCode,
                expiresAt: Date.now() + 10 * 60 * 1000
            };

            // Store keyed by email to allow multiple simultaneous pending signups
            const pendingSignups = JSON.parse(localStorage.getItem('kridex_signup_pending') || '{}');
            pendingSignups[email] = pendingData;
            localStorage.setItem('kridex_signup_pending', JSON.stringify(pendingSignups));

            // Send Email
            try {
                const { sendVerificationEmail, isEmailConfigured } = await import('../services/emailService');

                if (isEmailConfigured()) {
                    const emailResult = await sendVerificationEmail(email, verificationCode);
                    if (emailResult.success) {
                        return { success: true, emailSent: true };
                    } else {
                        console.error('Email sending failed:', emailResult.error);
                        // Return success=true so UI moves to code entry, but show code since email failed (fallback)
                        return {
                            success: true,
                            emailSent: false,
                            verificationCode, // Fallback for dev/demo
                            message: 'Email failed to send. Using fallback code.'
                        };
                    }
                } else {
                    // Demo mode
                    return { success: true, emailSent: false, verificationCode };
                }
            } catch (err) {
                console.error('Email service import failed:', err);
                return { success: true, emailSent: false, verificationCode };
            }

        } catch (error) {
            return handleError(error);
        }
    };

    // Step 2: Complete Signup - Verify Code and Create User
    const completeSignup = async (email, code) => {
        try {
            const pendingSignups = JSON.parse(localStorage.getItem('kridex_signup_pending') || '{}');
            const data = pendingSignups[email];

            if (!data) throw new Error('Start the signup process again (Session expired or not found)');
            if (Date.now() > data.expiresAt) throw new Error('Verification code expired');
            if (data.code !== code) throw new Error('Invalid verification code');

            // Create new user
            const newUser = {
                id: Date.now().toString(),
                email: data.email,
                name: data.name,
                password: data.password, // In production, hash this
                createdAt: new Date().toISOString(),
                followedSports: [],
                followedMatches: []
            };

            // Save to users list
            const existingUsers = JSON.parse(localStorage.getItem('kridex_users') || '[]');
            existingUsers.push(newUser);
            localStorage.setItem('kridex_users', JSON.stringify(existingUsers));

            // Cleanup pending
            delete pendingSignups[email];
            localStorage.setItem('kridex_signup_pending', JSON.stringify(pendingSignups));

            // Login user
            const { password: _, ...userWithoutPassword } = newUser;
            setUser(userWithoutPassword);

            return { success: true, user: userWithoutPassword };

        } catch (error) {
            return handleError(error);
        }
    };

    // Admin Helper to view all users
    const getAllUsers = () => {
        return JSON.parse(localStorage.getItem('kridex_users') || '[]');
    };

    const signup = async () => { throw new Error('Deprecated: Use initiateSignup'); }; // Deprecated placeholder

    const login = async (email, password) => {
        try {
            // Validate inputs
            if (!email || !password) {
                throw new Error('Email and password are required');
            }

            // Get users from localStorage
            const users = JSON.parse(localStorage.getItem('kridex_users') || '[]');
            const user = users.find(u => u.email === email);

            if (!user) {
                throw new Error('Invalid email or password');
            }

            // Verify password
            if (user.password !== password) {
                throw new Error('Invalid email or password');
            }

            // Set current user (without password)
            const { password: _, ...userWithoutPassword } = user;
            setUser(userWithoutPassword);
            return { success: true, user: userWithoutPassword };
        } catch (error) {
            return { success: false, error: error.message };
        }
    };

    const logout = () => {
        setUser(null);
        localStorage.removeItem('kridex_user');
    };

    const forgotPassword = async (email) => {
        try {
            // Validate input
            if (!email) {
                throw new Error('Email is required');
            }

            // Get users from localStorage
            const users = JSON.parse(localStorage.getItem('kridex_users') || '[]');
            const user = users.find(u => u.email === email);

            if (!user) {
                throw new Error('No account found with this email address');
            }

            // Generate a 6-digit verification code
            const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();

            // Store verification code with expiration (5 minutes)
            const resetData = {
                email: email,
                code: verificationCode,
                expiresAt: Date.now() + 5 * 60 * 1000 // 5 minutes from now
            };

            // Store in localStorage (in production, this would be in a database)
            localStorage.setItem('kridex_password_reset', JSON.stringify(resetData));

            // Send verification code via email
            try {
                const { sendVerificationEmail, isEmailConfigured } = await import('../services/emailService');

                // Check if EmailJS is configured
                if (isEmailConfigured()) {
                    const emailResult = await sendVerificationEmail(email, verificationCode);

                    if (emailResult.success) {
                        return {
                            success: true,
                            message: 'Verification code sent to your email',
                            emailSent: true
                        };
                    } else {
                        // Email service configured but sending failed
                        console.error('Email sending failed:', emailResult.error);
                        return {
                            success: true,
                            verificationCode: verificationCode, // Fallback for demo
                            message: 'Verification code generated. Email sending failed, showing code below.',
                            emailSent: false,
                            emailError: emailResult.error
                        };
                    }
                } else {
                    // EmailJS not configured - demo mode
                    console.warn('EmailJS not configured, using demo mode');
                    return {
                        success: true,
                        verificationCode: verificationCode, // Show code for demo
                        message: 'Demo mode: Verification code shown below',
                        emailSent: false,
                        emailError: 'Email service not configured'
                    };
                }
            } catch (error) {
                console.error('Error importing email service:', error);
                // Fallback to demo mode if import fails
                return {
                    success: true,
                    verificationCode: verificationCode,
                    message: 'Verification code generated',
                    emailSent: false,
                    emailError: 'Email service unavailable'
                };
            }
        } catch (error) {
            return { success: false, error: error.message };
        }
    };

    const verifyResetCode = async (email, code) => {
        try {
            // Validate inputs
            if (!email || !code) {
                throw new Error('Email and verification code are required');
            }

            // Get reset data from localStorage
            const resetDataStr = localStorage.getItem('kridex_password_reset');
            if (!resetDataStr) {
                throw new Error('No password reset request found. Please request a new code.');
            }

            const resetData = JSON.parse(resetDataStr);

            // Check if expired
            if (Date.now() > resetData.expiresAt) {
                localStorage.removeItem('kridex_password_reset');
                throw new Error('Verification code has expired. Please request a new one.');
            }

            // Check if email matches
            if (resetData.email !== email) {
                throw new Error('Invalid email address');
            }

            // Check if code matches
            if (resetData.code !== code) {
                throw new Error('Invalid verification code');
            }

            return {
                success: true,
                message: 'Verification code verified successfully'
            };
        } catch (error) {
            return { success: false, error: error.message };
        }
    };

    const resetPassword = async (email, newPassword, code) => {
        try {
            // Validate inputs
            if (!email || !newPassword || !code) {
                throw new Error('Email, new password, and verification code are required');
            }

            if (newPassword.length < 6) {
                throw new Error('Password must be at least 6 characters long');
            }

            // Verify code first
            const codeVerification = await verifyResetCode(email, code);
            if (!codeVerification.success) {
                return codeVerification;
            }

            // Get users from localStorage
            const users = JSON.parse(localStorage.getItem('kridex_users') || '[]');
            const userIndex = users.findIndex(u => u.email === email);

            if (userIndex === -1) {
                throw new Error('No account found with this email address');
            }

            // Update password
            users[userIndex].password = newPassword;
            localStorage.setItem('kridex_users', JSON.stringify(users));

            // Clear reset data
            localStorage.removeItem('kridex_password_reset');

            // If current user is the one resetting password, update their session
            if (user && user.email === email) {
                const updatedUser = { ...user };
                setUser(updatedUser);
            }

            return { success: true, message: 'Password reset successfully' };
        } catch (error) {
            return { success: false, error: error.message };
        }
    };

    const updateUser = (updates) => {
        if (!user) return;

        // Don't include password in the user state
        const { password, ...updatesWithoutPassword } = updates;
        const updatedUser = { ...user, ...updatesWithoutPassword };
        setUser(updatedUser);

        // Update in users list (preserve password from existing user)
        const users = JSON.parse(localStorage.getItem('kridex_users') || '[]');
        const userIndex = users.findIndex(u => u.id === user.id);
        if (userIndex !== -1) {
            // Merge updates with existing user data (preserve password from existing user)
            const existingUser = users[userIndex];
            // Only update non-password fields, always preserve the existing password
            const { password: existingPassword, ...existingWithoutPassword } = existingUser;
            users[userIndex] = {
                ...existingWithoutPassword,
                ...updatesWithoutPassword,
                password: existingPassword // Always preserve the original password
            };
            localStorage.setItem('kridex_users', JSON.stringify(users));
        }
    };

    const value = {
        user,
        loading,
        isAuthenticated: !!user,
        signup, // Kept for backward compat triggers error
        initiateSignup,
        completeSignup,
        getAllUsers, // For admin/dev view
        login,
        logout,
        forgotPassword,
        verifyResetCode,
        resetPassword,
        updateUser
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

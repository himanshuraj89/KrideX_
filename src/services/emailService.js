import emailjs from '@emailjs/browser';

// EmailJS Configuration
// Get these from https://www.emailjs.com/
const EMAILJS_SERVICE_ID = import.meta.env.VITE_EMAILJS_SERVICE_ID || '';
const EMAILJS_TEMPLATE_ID = import.meta.env.VITE_EMAILJS_TEMPLATE_ID || '';
const EMAILJS_PUBLIC_KEY = import.meta.env.VITE_EMAILJS_PUBLIC_KEY || '';

// Initialize EmailJS
if (EMAILJS_PUBLIC_KEY) {
    emailjs.init(EMAILJS_PUBLIC_KEY);
} else {
    console.warn('EmailJS public key not found in environment variables');
}

/**
 * Send verification code email to user
 * @param {string} userEmail - User's email address
 * @param {string} verificationCode - 6-digit verification code
 * @returns {Promise<{success: boolean, error?: string}>}
 */
export const sendVerificationEmail = async (userEmail, verificationCode) => {
    try {
        // Check if EmailJS is configured
        if (!EMAILJS_SERVICE_ID || !EMAILJS_TEMPLATE_ID || !EMAILJS_PUBLIC_KEY) {
            console.warn('EmailJS not configured. Missing credentials:', {
                hasServiceId: !!EMAILJS_SERVICE_ID,
                hasTemplateId: !!EMAILJS_TEMPLATE_ID,
                hasPublicKey: !!EMAILJS_PUBLIC_KEY
            });
            return {
                success: false,
                error: 'Email service not configured. Please contact support.'
            };
        }

        // Prepare email template parameters
        // Note: EmailJS template expects 'email' for recipient field (To Email)
        const templateParams = {
            email: userEmail,
            to_email: userEmail, // Also include for compatibility
            verification_code: verificationCode,
            app_name: 'KRIDEX',
            expiration_time: '5 minutes'
        };

        // Send email via EmailJS
        const response = await emailjs.send(
            EMAILJS_SERVICE_ID,
            EMAILJS_TEMPLATE_ID,
            templateParams
        );
        
        if (response.status === 200 || response.status === 0) {
            return {
                success: true,
                message: 'Verification code sent to your email'
            };
        } else {
            throw new Error(`Email service returned status: ${response.status}`);
        }
    } catch (error) {
        console.error('Error sending verification email:', error);
        
        // More detailed error handling
        let errorMessage = 'Failed to send verification email. Please try again.';
        
        if (error.text) {
            errorMessage = error.text;
        } else if (error.message) {
            errorMessage = error.message;
        } else if (typeof error === 'string') {
            errorMessage = error;
        }
        
        // Check for specific EmailJS errors
        if (errorMessage.includes('Invalid') || errorMessage.includes('invalid')) {
            errorMessage = 'Email service configuration error. Please check your EmailJS settings.';
        } else if (errorMessage.includes('limit') || errorMessage.includes('quota')) {
            errorMessage = 'Email service quota exceeded. Please try again later.';
        } else if (errorMessage.includes('Template') || errorMessage.includes('template')) {
            errorMessage = 'Email template error. Please check your EmailJS template configuration.';
        } else if (errorMessage.includes('Service') || errorMessage.includes('service')) {
            errorMessage = 'Email service error. Please verify your EmailJS service is connected.';
        }
        
        return {
            success: false,
            error: errorMessage
        };
    }
};

/**
 * Check if EmailJS is configured
 * @returns {boolean}
 */
export const isEmailConfigured = () => {
    const configured = !!(EMAILJS_SERVICE_ID && EMAILJS_TEMPLATE_ID && EMAILJS_PUBLIC_KEY);
    if (!configured) {
        console.warn('EmailJS Configuration Check:', {
            SERVICE_ID: EMAILJS_SERVICE_ID || 'MISSING',
            TEMPLATE_ID: EMAILJS_TEMPLATE_ID || 'MISSING',
            PUBLIC_KEY: EMAILJS_PUBLIC_KEY ? 'SET' : 'MISSING'
        });
    }
    return configured;
};

/**
 * Get EmailJS configuration status (for debugging)
 * @returns {object}
 */
export const getEmailConfigStatus = () => {
    return {
        serviceId: EMAILJS_SERVICE_ID || null,
        templateId: EMAILJS_TEMPLATE_ID || null,
        publicKey: EMAILJS_PUBLIC_KEY ? 'SET' : null,
        isConfigured: isEmailConfigured()
    };
};

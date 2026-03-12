/**
 * Maps Supabase auth errors to user-friendly messages
 */
export const getAuthErrorMessage = (error: any): string => {
    if (!error) return 'An unexpected error occurred';

    const message = error?.message?.toLowerCase() || '';
    const code = error?.code || '';

    // Email/Password errors
    if (message.includes('invalid login credentials') || code === 'invalid_credentials') {
        return 'Invalid email or password. Please check your credentials and try again.';
    }

    if (message.includes('email not confirmed') || code === 'email_not_confirmed') {
        return 'Please verify your email before signing in. Check your inbox for the confirmation link.';
    }

    if (message.includes('user already registered') || message.includes('already been registered')) {
        return 'An account with this email already exists. Try signing in instead.';
    }

    if (message.includes('invalid email')) {
        return 'Please enter a valid email address.';
    }

    if (message.includes('password') && message.includes('short')) {
        return 'Password must be at least 8 characters long.';
    }

    if (message.includes('password') && message.includes('weak')) {
        return 'Password is too weak. Use at least 8 characters with uppercase, lowercase, and numbers.';
    }

    // Rate limiting
    if (message.includes('too many requests') || code === 'over_request_rate_limit') {
        return 'Too many attempts. Please wait a few minutes before trying again.';
    }

    // Network errors
    if (message.includes('network') || message.includes('fetch')) {
        return 'Network error. Please check your connection and try again.';
    }

    // Token/Session errors
    if (message.includes('invalid token') || message.includes('expired')) {
        return 'Your session has expired. Please sign in again.';
    }

    // Username errors
    if (message.includes('username') && message.includes('taken')) {
        return 'This username is already taken. Please choose another one.';
    }

    // Default fallback
    return error.message || 'Something went wrong. Please try again.';
};

/**
 * Determines if an auth error is user-actionable vs system error
 */
export const isUserActionableError = (error: any): boolean => {
    const message = error?.message?.toLowerCase() || '';

    // User can fix these
    const actionable = [
        'invalid login credentials',
        'email not confirmed',
        'user already registered',
        'invalid email',
        'password',
        'username',
    ];

    return actionable.some(keyword => message.includes(keyword));
};

/**
 * Gets error severity level for UI styling
 */
export const getErrorSeverity = (error: any): 'error' | 'warning' | 'info' => {
    const message = error?.message?.toLowerCase() || '';

    if (message.includes('email not confirmed')) {
        return 'warning'; // They can resend
    }

    if (message.includes('user already registered')) {
        return 'info'; // Just redirectto sign in
    }

    return 'error'; // Default to error
};

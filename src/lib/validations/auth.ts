import { z } from 'zod';

/**
 * Sign In form validation schema
 */
export const signInSchema = z.object({
    email: z
        .string()
        .min(1, 'Email is required')
        .email('Please enter a valid email address'),
    password: z
        .string()
        .min(1, 'Password is required')
        .min(6, 'Password must be at least 6 characters'),
});

export type SignInFormData = z.infer<typeof signInSchema>;

/**
 * Sign Up form validation schema
 */
export const signUpSchema = z
    .object({
        username: z
            .string()
            .min(1, 'Username is required')
            .min(3, 'Username must be at least 3 characters')
            .max(20, 'Username must be less than 20 characters')
            .regex(
                /^[a-zA-Z0-9_]+$/,
                'Username can only contain letters, numbers, and underscores'
            )
            .regex(
                /^[a-zA-Z]/,
                'Username must start with a letter'
            ),
        email: z
            .string()
            .min(1, 'Email is required')
            .email('Please enter a valid email address'),
        password: z
            .string()
            .min(1, 'Password is required')
            .min(8, 'Password must be at least 8 characters')
            .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
            .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
            .regex(/[0-9]/, 'Password must contain at least one number'),
        confirmPassword: z
            .string()
            .min(1, 'Please confirm your password'),
    })
    .refine((data) => data.password === data.confirmPassword, {
        message: "Passwords don't match",
        path: ['confirmPassword'],
    });

export type SignUpFormData = z.infer<typeof signUpSchema>;

/**
 * Password Reset form validation schema
 */
export const resetPasswordSchema = z
    .object({
        password: z
            .string()
            .min(1, 'Password is required')
            .min(8, 'Password must be at least 8 characters')
            .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
            .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
            .regex(/[0-9]/, 'Password must contain at least one number'),
        confirmPassword: z
            .string()
            .min(1, 'Please confirm your password'),
    })
    .refine((data) => data.password === data.confirmPassword, {
        message: "Passwords don't match",
        path: ['confirmPassword'],
    });

export type ResetPasswordFormData = z.infer<typeof resetPasswordSchema>;

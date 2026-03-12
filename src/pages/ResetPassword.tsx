import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Eye, EyeOff, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { resetPasswordSchema, type ResetPasswordFormData } from '@/lib/validations/auth';
import { PasswordStrengthIndicator } from '@/components/auth/PasswordStrengthIndicator';
import { getAuthErrorMessage } from '@/lib/auth-errors';

export default function ResetPassword() {
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const navigate = useNavigate();

    const {
        register,
        handleSubmit,
        watch,
        formState: { errors },
    } = useForm<ResetPasswordFormData>({
        resolver: zodResolver(resetPasswordSchema),
    });

    const password = watch('password', '');

    // Check if there's a valid session
    useEffect(() => {
        const checkSession = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) {
                setError('Invalid or expired reset link. Please request a new password reset.');
            }
        };
        checkSession();
    }, []);

    const onSubmit = async (data: ResetPasswordFormData) => {
        setIsLoading(true);
        setError(null);

        try {
            const { error } = await supabase.auth.updateUser({
                password: data.password,
            });

            if (error) {
                setError(getAuthErrorMessage(error));
            } else {
                setSuccess(true);
                setTimeout(() => {
                    navigate('/auth');
                }, 3000);
            }
        } catch (err) {
            setError('An unexpected error occurred. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-civic-green/10 via-background to-civic-blue/10 flex items-center justify-center p-4">
            <div className="w-full max-w-md">
                <Card className="border-0 shadow-lg">
                    <CardHeader className="space-y-1">
                        <CardTitle className="text-2xl text-center">Reset Password</CardTitle>
                        <CardDescription className="text-center">
                            {success ? 'Password reset successful!' : 'Create a new secure password'}
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        {success ? (
                            <div className="space-y-4">
                                <Alert className="bg-green-50 border-green-200">
                                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                                    <AlertDescription className="text-green-800">
                                        Your password has been successfully reset. Redirecting to sign in...
                                    </AlertDescription>
                                </Alert>
                            </div>
                        ) : (
                            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="password">New Password</Label>
                                    <div className="relative">
                                        <Input
                                            id="password"
                                            type={showPassword ? 'text' : 'password'}
                                            placeholder="Create a strong password"
                                            {...register('password')}
                                            disabled={isLoading}
                                            className="pr-10"
                                            aria-invalid={!!errors.password}
                                        />
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="sm"
                                            className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                                            onClick={() => setShowPassword(!showPassword)}
                                            disabled={isLoading}
                                        >
                                            {showPassword ? (
                                                <EyeOff className="h-4 w-4" />
                                            ) : (
                                                <Eye className="h-4 w-4" />
                                            )}
                                        </Button>
                                    </div>
                                    {errors.password && (
                                        <p className="text-sm text-destructive">{errors.password.message}</p>
                                    )}
                                    <PasswordStrengthIndicator password={password} className="mt-3" />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="confirmPassword">Confirm Password</Label>
                                    <Input
                                        id="confirmPassword"
                                        type={showPassword ? 'text' : 'password'}
                                        placeholder="Re-enter your password"
                                        {...register('confirmPassword')}
                                        disabled={isLoading}
                                        aria-invalid={!!errors.confirmPassword}
                                    />
                                    {errors.confirmPassword && (
                                        <p className="text-sm text-destructive">{errors.confirmPassword.message}</p>
                                    )}
                                </div>

                                {error && (
                                    <Alert variant="destructive">
                                        <AlertCircle className="h-4 w-4" />
                                        <AlertDescription>{error}</AlertDescription>
                                    </Alert>
                                )}

                                <Button
                                    type="submit"
                                    className="w-full bg-civic-green hover:bg-civic-green/90"
                                    disabled={isLoading}
                                >
                                    {isLoading ? (
                                        <>
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                            Resetting Password...
                                        </>
                                    ) : (
                                        'Reset Password'
                                    )}
                                </Button>
                            </form>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
